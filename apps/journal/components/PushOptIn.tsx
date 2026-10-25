"use client";

// Activation des notifications push sur l'appareil.
//
// Contrainte à connaître : sur iPhone, le Web Push n'existe QUE si l'app a
// été ajoutée à l'écran d'accueil (iOS 16.4+). Dans Safari en onglet normal,
// `PushManager` est absent — d'où le message dédié plutôt qu'un bouton qui
// échouerait sans explication.

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Check, Loader2, Share } from "lucide-react";

type Etat =
  | "chargement"
  | "non-supporte"
  | "ios-a-installer"
  | "refuse"
  | "inactif"
  | "actif";

function estIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function estInstallee(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** base64url -> Uint8Array, format attendu par applicationServerKey. */
function cleVersOctets(base64url: string): Uint8Array {
  const bourrage = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + bourrage).replace(/-/g, "+").replace(/_/g, "/");
  const brut = atob(base64);
  const octets = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i);
  return octets;
}

function libelleAppareil(): string {
  const ua = navigator.userAgent;
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android/i.test(ua)) return "Android";
  if (/mac/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows";
  return "Appareil";
}

export default function PushOptIn() {
  const [etat, setEtat] = useState<Etat>("chargement");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      setEtat("non-supporte");
      return;
    }
    // Sur iOS hors écran d'accueil, PushManager n'existe pas du tout.
    if (!("PushManager" in window)) {
      setEtat(estIOS() && !estInstallee() ? "ios-a-installer" : "non-supporte");
      return;
    }
    if (Notification.permission === "denied") {
      setEtat("refuse");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEtat(sub ? "actif" : "inactif"))
      .catch(() => setEtat("non-supporte"));
  }, []);

  const activer = useCallback(async () => {
    setOccupe(true);
    setMessage(null);
    // Chaque etape rapporte son propre echec. Un catch unique affichait
    // "Impossible d'activer" sans dire laquelle avait lache, ce qui rendait
    // tout diagnostic a distance impossible.
    let etape = "demarrage";
    try {
      etape = "autorisation";
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat(permission === "denied" ? "refuse" : "inactif");
        if (permission === "default") {
          setMessage("Autorisation non accordee — reessaie et choisis « Autoriser ».");
        }
        return;
      }

      etape = "cle serveur";
      const rep = await fetch("/api/push/cle");
      if (!rep.ok) {
        setMessage(`Cle serveur indisponible (HTTP ${rep.status}).`);
        return;
      }
      const { cle } = await rep.json();
      if (typeof cle !== "string" || cle.length < 80) {
        setMessage("La cle publique recue par le serveur est invalide.");
        return;
      }

      etape = "service worker";
      await navigator.serviceWorker.register("/sw.js");
      // On prend l'enregistrement ACTIF : celui que `register` renvoie peut
      // etre encore en cours d'installation, et son pushManager echoue alors.
      const reg = await navigator.serviceWorker.ready;

      etape = "abonnement";
      // Un abonnement residuel cree avec une autre cle VAPID fait echouer
      // `subscribe` avec InvalidStateError : on le retire d'abord. On previent
      // aussi le serveur, sinon sa ligne reste en base en orphelin et recevra
      // des envois qui n'aboutiront jamais.
      const existant = await reg.pushManager.getSubscription();
      if (existant) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existant.endpoint }),
        }).catch(() => {});
        await existant.unsubscribe().catch(() => {});
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: cleVersOctets(cle) as BufferSource,
      });

      etape = "enregistrement";
      const brut = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const enreg = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brut, libelle: libelleAppareil() }),
      });
      if (!enreg.ok) {
        const detail = await enreg.text().catch(() => "");
        setMessage(`Enregistrement refuse (HTTP ${enreg.status}). ${detail.slice(0, 140)}`);
        return;
      }

      setEtat("actif");
      setMessage("Notifications activees sur cet appareil.");
    } catch (e) {
      const err = e as { name?: string; message?: string };
      setMessage(
        `Echec a l'etape « ${etape} » : ${err.name || "Erreur"} — ${err.message || "sans detail"}`
      );
    } finally {
      setOccupe(false);
    }
  }, []);

  const desactiver = useCallback(async () => {
    setOccupe(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEtat("inactif");
      setMessage(null);
    } finally {
      setOccupe(false);
    }
  }, []);

  const tester = useCallback(async () => {
    setOccupe(true);
    setMessage(null);
    try {
      const r = await fetch("/api/push/test", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      setMessage(
        r.ok
          ? `Envoyé à ${j.envoyes} appareil${j.envoyes > 1 ? "s" : ""}.`
          : j.error || "L'envoi de test a échoué."
      );
    } finally {
      setOccupe(false);
    }
  }, []);

  if (etat === "chargement" || etat === "non-supporte") return null;

  if (etat === "ios-a-installer") {
    return (
      <div className="push-bloc">
        <Share className="push-icone" aria-hidden="true" />
        <div className="push-texte">
          <strong>Notifications sur iPhone</strong>
          <p>
            iOS ne les autorise que depuis l&apos;app installée. Bouton Partager → « Sur
            l&apos;écran d&apos;accueil », puis rouvre Journal depuis l&apos;icône.
          </p>
        </div>
      </div>
    );
  }

  if (etat === "refuse") {
    return (
      <div className="push-bloc">
        <BellOff className="push-icone" aria-hidden="true" />
        <div className="push-texte">
          <strong>Notifications bloquées</strong>
          <p>
            Tu les as refusées pour ce site. Réautorise-les dans les réglages du navigateur,
            puis recharge la page.
          </p>
        </div>
      </div>
    );
  }

  if (etat === "actif") {
    return (
      <div className="push-bloc actif">
        <BellRing className="push-icone" aria-hidden="true" />
        <div className="push-texte">
          <strong>
            <Check className="inline-icone" aria-hidden="true" /> Notifications activées
          </strong>
          {message && <p>{message}</p>}
        </div>
        <div className="push-actions">
          <button type="button" onClick={tester} disabled={occupe}>
            {occupe ? <Loader2 className="inline-icone tourne" aria-hidden="true" /> : null} Tester
          </button>
          <button type="button" className="discret" onClick={desactiver} disabled={occupe}>
            Désactiver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="push-bloc">
      <Bell className="push-icone" aria-hidden="true" />
      <div className="push-texte">
        <strong>Reçois tes rappels sur ce téléphone</strong>
        <p>{message ?? "Une notification quand la journée n'a pas encore été entamée."}</p>
      </div>
      <div className="push-actions">
        <button type="button" onClick={activer} disabled={occupe}>
          {occupe ? <Loader2 className="inline-icone tourne" aria-hidden="true" /> : null} Activer
        </button>
      </div>
    </div>
  );
}
