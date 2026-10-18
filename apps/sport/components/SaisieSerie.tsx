"use client";

// Saisie série par série.
//
// L'ancienne version demandait poids / reps / nombre de séries dans trois
// champs numériques, puis enregistrait UNE ligne agrégée. On ne pouvait donc
// pas faire varier la charge d'une série à l'autre, et il fallait un clavier.
//
// Ici chaque série est validée seule et écrit sa propre ligne (`sets: 1`).
// Les agrégats de l'app somment `sets`, donc les totaux restent justes et
// aucune migration n'est nécessaire : les anciennes lignes à `sets: 3`
// continuent de compter pour trois.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Minus, X, MessageSquarePlus } from "lucide-react";
import { todayISO } from "@/lib/domain/services";

export type SerieSaisie = {
  /** Identifiant local, le temps de la session. */
  cle: number;
  poids: number;
  reps: number;
  dureeSec: number;
  note: string;
  validee: boolean;
};

type Props = {
  exerciceId: string;
  auDuree: boolean;
  /** Valeurs de départ, issues de la cible auto. */
  depart: { poids: number; reps: number; dureeSec: number };
  nbSeriesSuggere: number;
  derniereSeance: {
    date: string;
    series: Array<{ poids: number; reps: number; sets: number; dureeSecondes?: number | null }>;
  } | null;
  /** Secondes de repos entre deux séries. */
  reposSec?: number;
  onSerieValidee?: () => void;
  /**
   * N'écrit rien et ne rafraîchit pas : réservé à la route d'aperçu, qui
   * tourne sans base de données. Jamais activé depuis l'app.
   */
  simulation?: boolean;
};

function fmtDuree(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}min` : `${m}min${String(s).padStart(2, "0")}`;
}

/** Séparateur décimal français : la cible affichée juste au-dessus écrit « 52,5 kg ». */
function fmtNombre(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function dateCourte(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Incrémenteur tactile : plus de clavier à sortir en pleine série. */
function Pas({
  label,
  valeur,
  pas,
  min = 0,
  suffixe,
  onChange,
  disabled,
}: {
  label: string;
  valeur: number;
  pas: number;
  min?: number;
  suffixe?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const arrondi = (v: number) => Math.round(v * 100) / 100;
  return (
    <div className="pas">
      <span className="pas-label">{label}</span>
      <div className="pas-corps">
        <button
          type="button"
          aria-label={`Diminuer ${label}`}
          disabled={disabled || valeur <= min}
          onClick={() => onChange(arrondi(Math.max(min, valeur - pas)))}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="pas-valeur">
          {fmtNombre(valeur)}
          {suffixe && <i>{suffixe}</i>}
        </span>
        <button
          type="button"
          aria-label={`Augmenter ${label}`}
          disabled={disabled}
          onClick={() => onChange(arrondi(valeur + pas))}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Anneau de repos : décompte visuel entre deux séries. */
function AnneauRepos({ restant, total, onPasser }: { restant: number; total: number; onPasser: () => void }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const part = total > 0 ? restant / total : 0;
  return (
    <div className="repos" role="timer" aria-live="off">
      <div className="repos-anneau">
        <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--anat-0)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke="var(--accent)" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - part)}
            transform="rotate(-90 32 32)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="repos-chiffre">{restant}</span>
      </div>
      <div className="repos-texte">
        <b>Repos</b>
        <span>Reprends dans {restant}s</span>
      </div>
      <button type="button" className="repos-passer" onClick={onPasser}>
        Passer <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function SaisieSerie({
  exerciceId,
  auDuree,
  depart,
  nbSeriesSuggere,
  derniereSeance,
  reposSec = 90,
  onSerieValidee,
  simulation = false,
}: Props) {
  const router = useRouter();
  const cle = useRef(0);

  const [lignes, setLignes] = useState<SerieSaisie[]>(() =>
    Array.from({ length: Math.max(1, nbSeriesSuggere) }, () => ({
      cle: cle.current++,
      poids: depart.poids,
      reps: depart.reps,
      dureeSec: depart.dureeSec,
      note: "",
      validee: false,
    }))
  );
  const [enCours, setEnCours] = useState<number | null>(null);
  const [eclat, setEclat] = useState<number | null>(null);
  const [repos, setRepos] = useState<number | null>(null);
  const [notesOuvertes, setNotesOuvertes] = useState<Set<number>>(new Set());

  // Décompte du repos.
  useEffect(() => {
    if (repos == null) return;
    if (repos <= 0) {
      setRepos(null);
      return;
    }
    const t = setTimeout(() => setRepos((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [repos]);

  const maj = useCallback((k: number, champ: keyof SerieSaisie, v: number | string) => {
    setLignes((ls) => ls.map((l) => (l.cle === k ? { ...l, [champ]: v } : l)));
  }, []);

  async function valider(ligne: SerieSaisie) {
    setEnCours(ligne.cle);
    const corps = auDuree
      ? { date: todayISO(), exerciceId, sets: 1, dureeSecondes: ligne.dureeSec, note: ligne.note }
      : { date: todayISO(), exerciceId, poids: ligne.poids, reps: ligne.reps, sets: 1, note: ligne.note };

    if (!simulation) {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      if (!res.ok) {
        setEnCours(null);
        return;
      }
    }
    setEnCours(null);

    setLignes((ls) => ls.map((l) => (l.cle === ligne.cle ? { ...l, validee: true } : l)));
    setEclat(ligne.cle);
    setTimeout(() => setEclat(null), 700);
    setRepos(reposSec);
    onSerieValidee?.();
    if (!simulation) router.refresh();
  }

  function ajouterLigne() {
    const derniere = lignes[lignes.length - 1];
    setLignes((ls) => [
      ...ls,
      {
        cle: cle.current++,
        poids: derniere?.poids ?? depart.poids,
        reps: derniere?.reps ?? depart.reps,
        dureeSec: derniere?.dureeSec ?? depart.dureeSec,
        note: "",
        validee: false,
      },
    ]);
  }

  const faites = lignes.filter((l) => l.validee).length;

  return (
    <div className="saisie">
      {derniereSeance && (
        <p className="saisie-rappel">
          <span>Dernière fois ({dateCourte(derniereSeance.date)})</span>
          <b>
            {derniereSeance.series
              .map((s) =>
                s.dureeSecondes != null
                  ? `${fmtDuree(s.dureeSecondes)}×${s.sets}`
                  : `${fmtNombre(s.poids)} kg × ${s.reps}${s.sets > 1 ? ` ×${s.sets}` : ""}`
              )
              .join(" · ")}
          </b>
        </p>
      )}

      <ul className="saisie-lignes">
        {lignes.map((l, i) => (
          <li
            key={l.cle}
            className={`saisie-ligne${l.validee ? " faite" : ""}${eclat === l.cle ? " eclat" : ""}`}
          >
            <div className="saisie-ligne-haut">
            <span className="saisie-num" aria-hidden="true">{i + 1}</span>

            {auDuree ? (
              <Pas
                label="Durée" valeur={l.dureeSec} pas={5} min={5} suffixe="s"
                disabled={l.validee}
                onChange={(v) => maj(l.cle, "dureeSec", v)}
              />
            ) : (
              <>
                <Pas
                  label="Poids" valeur={l.poids} pas={2.5} suffixe="kg"
                  disabled={l.validee}
                  onChange={(v) => maj(l.cle, "poids", v)}
                />
                <Pas
                  label="Reps" valeur={l.reps} pas={1} min={1}
                  disabled={l.validee}
                  onChange={(v) => maj(l.cle, "reps", v)}
                />
              </>
            )}

            {!l.validee && !notesOuvertes.has(l.cle) && !l.note && (
              <button
                type="button"
                className="saisie-note-ouvrir"
                onClick={() => setNotesOuvertes((n) => new Set(n).add(l.cle))}
                aria-label={`Ajouter une note à la série ${i + 1}`}
              >
                <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              className="saisie-valider"
              disabled={l.validee || enCours === l.cle}
              onClick={() => valider(l)}
              aria-label={l.validee ? `Série ${i + 1} validée` : `Valider la série ${i + 1}`}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
            </button>
            </div>

            {/* Note de série : l'ancien formulaire en avait une, la saisie
                série par série l'avait perdue. Une par série plutôt qu'une
                pour tout l'exercice, puisque chaque série est sa propre ligne. */}
            {(notesOuvertes.has(l.cle) || l.note) && (
              <input
                className="saisie-note"
                type="text"
                placeholder="Note sur cette série…"
                value={l.note}
                disabled={l.validee}
                onChange={(e) => maj(l.cle, "note", e.target.value)}
                aria-label={`Note sur la série ${i + 1}`}
              />
            )}
          </li>
        ))}
      </ul>

      {repos != null && (
        <AnneauRepos restant={repos} total={reposSec} onPasser={() => setRepos(null)} />
      )}

      <div className="saisie-pied">
        <button type="button" className="saisie-ajout" onClick={ajouterLigne}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Série supplémentaire
        </button>
        <span className="saisie-compte">
          {faites} / {lignes.length} validées
        </span>
      </div>
    </div>
  );
}
