"use client";

// Les deux cartes d'accueil, pensees comme des widgets : on les lit d'un coup
// d'oeil et on agit dessus sans ouvrir quoi que ce soit.
//
//   Carte Serie  -- la serie de jours tenus, la semaine en cours, et les
//                   disciplines du jour validables au doigt.
//   Carte Jour   -- deux volets qui glissent : les taches a cocher, puis la
//                   note du jour. Le second volet existe parce que la note
//                   etait enterree en bas de page et ne se remplissait jamais.
//
// Elles ne s'affichent que sur la journee du jour : une serie ou une case a
// cocher n'a aucun sens sur une journee archivee.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconClock, IconPen } from "./icons";

export type JourSemaine = {
  date: string;
  lettre: string;
  validee: boolean;
  estAujourdhui: boolean;
  futur: boolean;
};
export type DisciplineWidget = {
  id: string;
  nom: string;
  icone: string;
  couleur: string;
  faite: boolean;
};
export type TacheWidget = {
  id: string;
  texte: string;
  heure: string | null;
  fait: boolean;
};

/** 0 aucune serie, 1 demarree, 2 installee (7j), 3 ancree (30j). */
function niveauFlamme(streak: number): 0 | 1 | 2 | 3 {
  if (streak <= 0) return 0;
  if (streak < 7) return 1;
  if (streak < 30) return 2;
  return 3;
}

/**
 * La flamme grandit avec la serie plutot que de rester un pictogramme fixe :
 * c'est le seul element de la carte qui porte l'information sans chiffre.
 */
function Flamme({ niveau }: { niveau: 0 | 1 | 2 | 3 }) {
  const eteinte = niveau === 0;
  return (
    <svg className={`wdg-flamme n${niveau}`} viewBox="0 0 24 26" aria-hidden="true">
      <defs>
        <linearGradient id="wdg-feu" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#e2912c" />
          <stop offset="55%" stopColor="#f6b64b" />
          <stop offset="100%" stopColor="#fff0cf" />
        </linearGradient>
        <filter id="wdg-halo" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      {/* Halo : la meme silhouette floutee dessous, pour que la flamme eclaire
          le bleu de la carte au lieu d'y etre posee a plat. */}
      {!eteinte && (
        <path
          className="wdg-flamme-halo"
          d="M12 1.6c4.3 3.8 6.7 7.2 6.7 10.2a6.7 6.7 0 0 1-13.4 0c0-1.9.7-3.7 2-5.3.1 1.8.7 3 1.9 3.5-.2-3.1.7-5.9 2.8-8.4Z"
          filter="url(#wdg-halo)"
        />
      )}
      <path
        className="wdg-flamme-corps"
        d="M12 1.6c4.3 3.8 6.7 7.2 6.7 10.2a6.7 6.7 0 0 1-13.4 0c0-1.9.7-3.7 2-5.3.1 1.8.7 3 1.9 3.5-.2-3.1.7-5.9 2.8-8.4Z"
      />
      {/* Le coeur blanc n'apparait qu'a 30 jours : la flamme change d'etat, pas
          seulement de taille. */}
      {niveau === 3 && (
        <path
          className="wdg-flamme-coeur"
          d="M12 11.4c1.9 1.7 2.9 3.2 2.9 4.5a2.9 2.9 0 0 1-5.8 0c0-1.3 1-2.8 2.9-4.5Z"
        />
      )}
    </svg>
  );
}

function phraseSerie(streak: number, faitesAujourdhui: number, total: number): string {
  if (streak === 0) {
    return total === 0
      ? "Ajoute une discipline pour lancer la série."
      : "Valide une discipline, la série démarre aujourd'hui.";
  }
  if (faitesAujourdhui === 0) return "Rien aujourd'hui — la série tombe à minuit.";
  if (streak === 7) return "Une semaine pleine.";
  if (streak === 30) return "Trente jours. C'est devenu un réflexe.";
  if (streak === 100) return "Cent jours.";
  if (faitesAujourdhui === total) return "Journée complète.";
  return `${faitesAujourdhui} sur ${total} validée${total > 1 ? "s" : ""} aujourd'hui.`;
}

/**
 * La question posee au-dessus de la note depend de l'etat de la journee.
 * « Comment s'est passée cette journée ? » ne declenche rien ; une question
 * qui sait ou on en est, si.
 * `heure` vient du serveur pour que le rendu soit identique des deux cotes.
 */
function questionDuJour(args: {
  heure: number;
  restantes: number;
  total: number;
  disciplinesFaites: number;
}): string {
  const { heure, restantes, total, disciplinesFaites } = args;
  if (total > 0 && restantes === 0) return "Qu'est-ce qui a rendu la journée facile ?";
  if (heure >= 20 && restantes > 0) return "Qu'est-ce qui t'a ralenti aujourd'hui ?";
  if (disciplinesFaites > 0) return "Comment s'est passée ta session ?";
  if (heure >= 14 && disciplinesFaites === 0) return "Qu'est-ce qui bloque aujourd'hui ?";
  if (heure < 11) return "Qu'est-ce que tu veux avoir fait ce soir ?";
  return "Qu'est-ce que tu retiens de la journée ?";
}

export default function WidgetAccueil({
  date,
  heure,
  streak,
  semaine,
  disciplines,
  taches,
  noteInitiale,
}: {
  date: string;
  heure: number;
  streak: number;
  semaine: JourSemaine[];
  disciplines: DisciplineWidget[];
  taches: TacheWidget[];
  noteInitiale: string;
}) {
  const router = useRouter();

  // Etat optimiste : la carte doit repondre au doigt tout de suite, le
  // `router.refresh()` ne fait que confirmer derriere.
  const [discFaites, setDiscFaites] = useState<Set<string>>(
    () => new Set(disciplines.filter((d) => d.faite).map((d) => d.id))
  );
  const [tachesFaites, setTachesFaites] = useState<Set<string>>(
    () => new Set(taches.filter((t) => t.fait).map((t) => t.id))
  );
  const [enCours, setEnCours] = useState<Set<string>>(new Set());

  // On resynchronise sur la verite serveur, mais seulement quand elle change
  // VRAIMENT : les tableaux arrivent avec une nouvelle identite a chaque rendu,
  // les comparer tels quels relancerait l'effet en boucle et ecraserait l'etat
  // optimiste au milieu d'un clic.
  const signatureDisc = disciplines.map((d) => `${d.id}${d.faite ? "1" : "0"}`).join();
  const signatureTaches = taches.map((t) => `${t.id}${t.fait ? "1" : "0"}`).join();
  useEffect(() => {
    setDiscFaites(new Set(disciplines.filter((d) => d.faite).map((d) => d.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureDisc]);
  useEffect(() => {
    setTachesFaites(new Set(taches.filter((t) => t.fait).map((t) => t.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureTaches]);

  const marquer = (id: string, actif: boolean) =>
    setEnCours((s) => {
      const n = new Set(s);
      if (actif) n.add(id);
      else n.delete(id);
      return n;
    });

  const basculerDiscipline = useCallback(
    async (id: string) => {
      if (enCours.has(id)) return;
      marquer(id, true);
      setDiscFaites((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
      try {
        await fetch(`/api/disciplines/${id}/toggle`, { method: "POST" });
        router.refresh();
      } finally {
        marquer(id, false);
      }
    },
    [enCours, router]
  );

  const basculerTache = useCallback(
    async (id: string) => {
      if (enCours.has(id)) return;
      marquer(id, true);
      setTachesFaites((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
      try {
        await fetch(`/api/taches/${id}`, { method: "PATCH" });
        router.refresh();
      } finally {
        marquer(id, false);
      }
    },
    [enCours, router]
  );

  const faitesAujourdhui = disciplines.filter((d) => discFaites.has(d.id)).length;
  const restantes = taches.filter((t) => !tachesFaites.has(t.id)).length;
  const aMontrer = [
    ...taches.filter((t) => !tachesFaites.has(t.id)),
    ...taches.filter((t) => tachesFaites.has(t.id)),
  ].slice(0, 3);

  return (
    <div className="wdg-bande">
      <CarteSerie
        streak={streak}
        semaine={semaine}
        disciplines={disciplines}
        discFaites={discFaites}
        enCours={enCours}
        onBasculer={basculerDiscipline}
        phrase={phraseSerie(streak, faitesAujourdhui, disciplines.length)}
      />
      <CarteJour
        date={date}
        taches={aMontrer}
        tachesFaites={tachesFaites}
        restantes={restantes}
        totalTaches={taches.length}
        onBasculer={basculerTache}
        noteInitiale={noteInitiale}
        question={questionDuJour({
          heure,
          restantes,
          total: taches.length,
          disciplinesFaites: faitesAujourdhui,
        })}
      />
    </div>
  );
}

/* ─────────────────────────── Carte Série ─────────────────────────── */

function CarteSerie({
  streak,
  semaine,
  disciplines,
  discFaites,
  enCours,
  onBasculer,
  phrase,
}: {
  streak: number;
  semaine: JourSemaine[];
  disciplines: DisciplineWidget[];
  discFaites: Set<string>;
  enCours: Set<string>;
  onBasculer: (id: string) => void;
  phrase: string;
}) {
  const niveau = niveauFlamme(streak);
  return (
    <section className="wdg wdg-serie" aria-label="Série de jours tenus">
      <div className="wdg-serie-haut">
        <div className="wdg-serie-texte">
          <p className="wdg-nombre">
            {streak}
            <span>{streak > 1 ? " jours" : " jour"}</span>
          </p>
          <p className="wdg-phrase">{phrase}</p>

          <ol className="wdg-semaine" aria-label="Cette semaine">
            {semaine.map((j) => (
              <li
                key={j.date}
                className={[
                  "wdg-sem-jour",
                  j.validee ? "ok" : "",
                  j.estAujourdhui ? "today" : "",
                  j.futur ? "futur" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="wdg-sem-lettre" aria-hidden="true">
                  {j.lettre}
                </span>
                <span className="wdg-sem-case">
                  {j.validee && (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7" />
                    </svg>
                  )}
                </span>
                <span className="sr-only">
                  {j.validee ? "tenu" : j.futur ? "à venir" : "non tenu"}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <Flamme niveau={niveau} />
      </div>

      {disciplines.length > 0 && (
        <div className="wdg-disciplines">
          {disciplines.map((d) => {
            const faite = discFaites.has(d.id);
            return (
              <button
                key={d.id}
                type="button"
                className={`wdg-disc ${faite ? "ok" : ""} ${enCours.has(d.id) ? "busy" : ""}`}
                aria-pressed={faite}
                onClick={() => onBasculer(d.id)}
              >
                <span className="wdg-disc-icone" aria-hidden="true">
                  {d.icone}
                </span>
                {d.nom}
                {faite && (
                  <svg className="wdg-disc-check" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ──────────────────── Carte Jour (tâches ⇄ note) ──────────────────── */

function CarteJour({
  date,
  taches,
  tachesFaites,
  restantes,
  totalTaches,
  onBasculer,
  noteInitiale,
  question,
}: {
  date: string;
  taches: TacheWidget[];
  tachesFaites: Set<string>;
  restantes: number;
  totalTaches: number;
  onBasculer: (id: string) => void;
  noteInitiale: string;
  question: string;
}) {
  const [volet, setVolet] = useState(0);
  const [glisse, setGlisse] = useState(0);
  const cadreRef = useRef<HTMLDivElement>(null);
  const geste = useRef<{ x: number; y: number; axe: "?" | "x" | "y" } | null>(null);

  const [note, setNote] = useState(noteInitiale);
  const [enregistree, setEnregistree] = useState(true);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNote(noteInitiale);
    setEnregistree(true);
  }, [date, noteInitiale]);

  const enregistrer = useCallback(
    async (valeur: string) => {
      await fetch("/api/notes-jour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, texte: valeur }),
      });
      setEnregistree(true);
    },
    [date]
  );

  function changerNote(valeur: string) {
    setNote(valeur);
    setEnregistree(false);
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => enregistrer(valeur), 900);
  }

  function sortieNote() {
    if (minuteur.current) clearTimeout(minuteur.current);
    if (!enregistree) enregistrer(note);
  }

  // Glissement au doigt. L'axe n'est decide qu'apres quelques pixels : sans
  // ca, le moindre depart horizontal pendant un scroll vertical bloquerait la
  // page. Les champs (textarea, boutons) sont exclus du geste pour qu'on
  // puisse encore y selectionner du texte.
  function debutGeste(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("textarea, input, button, [data-sans-geste]")) return;
    geste.current = { x: e.clientX, y: e.clientY, axe: "?" };
  }

  function mouvementGeste(e: React.PointerEvent) {
    const g = geste.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.axe === "?") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.axe = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.axe === "y") {
        geste.current = null;
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // Resistance aux bords : on ne tire pas dans le vide.
    const limite = (volet === 0 && dx > 0) || (volet === 1 && dx < 0);
    setGlisse(limite ? dx * 0.25 : dx);
  }

  function finGeste() {
    if (!geste.current || geste.current.axe !== "x") {
      geste.current = null;
      setGlisse(0);
      return;
    }
    const largeur = cadreRef.current?.offsetWidth ?? 320;
    const seuil = Math.min(70, largeur * 0.22);
    if (glisse < -seuil && volet === 0) setVolet(1);
    else if (glisse > seuil && volet === 1) setVolet(0);
    geste.current = null;
    setGlisse(0);
  }

  const toutFait = totalTaches > 0 && restantes === 0;

  return (
    <section className="wdg wdg-carte-jour" aria-label="Journée">
      <div
        className="wdg-cadre"
        ref={cadreRef}
        onPointerDown={debutGeste}
        onPointerMove={mouvementGeste}
        onPointerUp={finGeste}
        onPointerCancel={finGeste}
      >
        <div
          className={`wdg-piste ${glisse !== 0 ? "tire" : ""}`}
          style={{ transform: `translateX(calc(${volet * -50}% + ${glisse}px))` }}
        >
          {/* ── Volet 1 : les tâches ── */}
          <div className="wdg-volet" aria-hidden={volet !== 0}>
            <p className="wdg-compte">
              {totalTaches === 0
                ? "Aucune tâche"
                : toutFait
                  ? "Tout est coché"
                  : `${restantes} tâche${restantes > 1 ? "s" : ""}`}
            </p>

            {totalTaches === 0 ? (
              <p className="wdg-vide">
                Pose-en une plus bas, ou glisse à droite pour noter la journée.
              </p>
            ) : (
              <ul className="wdg-taches">
                {taches.map((t) => {
                  const fait = tachesFaites.has(t.id);
                  return (
                    <li key={t.id} className={fait ? "ok" : ""}>
                      <button
                        type="button"
                        className="wdg-chk"
                        role="checkbox"
                        aria-checked={fait}
                        aria-label={t.texte}
                        onClick={() => onBasculer(t.id)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m5 12.5 4.5 4.5L19 7" />
                        </svg>
                      </button>
                      <span className="wdg-tache-txt">{t.texte}</span>
                      {t.heure && (
                        <span className="wdg-heure">
                          <IconClock aria-hidden="true" />
                          {t.heure}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Volet 2 : la note du jour ── */}
          <div className="wdg-volet" aria-hidden={volet !== 1}>
            <p className="wdg-compte note">
              <IconPen aria-hidden="true" />
              Infos du jour
              <span className="wdg-etat">{enregistree ? "" : "enregistrement…"}</span>
            </p>
            <textarea
              className="wdg-note"
              placeholder={question}
              value={note}
              onChange={(e) => changerNote(e.target.value)}
              onBlur={sortieNote}
              tabIndex={volet === 1 ? 0 : -1}
            />
          </div>
        </div>
      </div>

      <div className="wdg-points" role="tablist" aria-label="Volets de la carte">
        {["Tâches", "Note du jour"].map((nom, i) => (
          <button
            key={nom}
            type="button"
            role="tab"
            aria-selected={volet === i}
            aria-label={nom}
            className={volet === i ? "on" : ""}
            onClick={() => setVolet(i)}
          />
        ))}
      </div>
    </section>
  );
}
