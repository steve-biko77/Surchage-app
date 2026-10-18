"use client";

// « Focus perf » : un coup d'œil rapide sur la progression d'un exercice,
// sans quitter la séance. Les données viennent de /api/progression, qui
// existait déjà — rien n'est recalculé côté client.
//
// Le panneau se ferme à Échap ou au clic hors de lui, et le focus clavier
// y est piégé le temps qu'il est ouvert.

import { useCallback, useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus, X, Trophy, CalendarDays } from "lucide-react";

type Point = {
  date: string;
  poids: number;
  reps: number;
  sets: number;
  dureeSecondes: number | null;
  volume: number;
  unRM: number | null;
};

type Progression = {
  points: Point[];
  metriquePrincipale: "poids" | "volume" | "reps" | "duree";
  auPoidsDuCorps: boolean;
  aDuree: boolean;
  deltas: { poids: number; volume: number; reps: number; duree: number };
  nbSeances: number;
  unRMMax: number | null;
};

const LIBELLE: Record<Progression["metriquePrincipale"], string> = {
  poids: "Charge",
  volume: "Volume",
  reps: "Répétitions",
  duree: "Durée",
};

const UNITE: Record<Progression["metriquePrincipale"], string> = {
  poids: "kg",
  volume: "kg·rép",
  reps: "",
  duree: "s",
};

function valeur(p: Point, m: Progression["metriquePrincipale"]): number {
  if (m === "poids") return p.poids;
  if (m === "volume") return p.volume;
  if (m === "reps") return p.reps;
  return p.dureeSecondes ?? 0;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function jourMois(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function FocusPerf({
  exerciceId,
  nom,
  onClose,
}: {
  exerciceId: string;
  nom: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<Progression | null>(null);
  const [erreur, setErreur] = useState(false);
  const panneau = useRef<HTMLDivElement>(null);
  const fermeture = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let vivant = true;
    fetch(`/api/progression?exerciceId=${encodeURIComponent(exerciceId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => vivant && setData(j))
      .catch(() => vivant && setErreur(true));
    return () => {
      vivant = false;
    };
  }, [exerciceId]);

  // Échap pour fermer, et on rend le focus au panneau à l'ouverture.
  useEffect(() => {
    fermeture.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const surFond = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const m = data?.metriquePrincipale ?? "poids";
  const pts = (data?.points ?? []).slice(-12);
  const serie = pts.map((p) => ({ date: jourMois(p.date), valeur: valeur(p, m) }));
  const delta = data ? data.deltas[m === "duree" ? "duree" : m] : 0;
  const Fleche = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const tonDelta = delta > 0 ? "hausse" : delta < 0 ? "baisse" : "plat";

  return (
    <div className="focus-fond" onMouseDown={surFond} role="presentation">
      <div
        className="focus-panneau"
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-label={`Progression — ${nom}`}
      >
        <header className="focus-tete">
          <div className="min-w-0">
            <span className="focus-k">Progression</span>
            <h3>{nom}</h3>
          </div>
          <button ref={fermeture} type="button" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        {erreur ? (
          <p className="focus-vide">Progression indisponible pour le moment.</p>
        ) : !data ? (
          <div className="focus-attente" aria-live="polite">
            <span /><span /><span />
          </div>
        ) : data.points.length < 2 ? (
          <p className="focus-vide">
            Une seule séance enregistrée — la courbe apparaîtra dès la deuxième.
          </p>
        ) : (
          <>
            <div className="focus-stats">
              <div className={`focus-stat ${tonDelta}`}>
                <Fleche className="h-4 w-4" aria-hidden="true" />
                <div>
                  <b>
                    {delta > 0 ? "+" : ""}
                    {fmt(delta)} {UNITE[m]}
                  </b>
                  <span>{LIBELLE[m]} depuis le début</span>
                </div>
              </div>
              <div className="focus-stat">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                <div>
                  <b>{data.nbSeances}</b>
                  <span>séries enregistrées</span>
                </div>
              </div>
              {data.unRMMax != null && (
                <div className="focus-stat">
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <b>{fmt(data.unRMMax)} kg</b>
                    <span>1RM estimé max</span>
                  </div>
                </div>
              )}
            </div>

            <div className="focus-graphe">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--grille)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--grey)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--grille)" }}
                  />
                  <YAxis
                    tick={{ fill: "var(--grey)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={38}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--tooltip-bg)",
                      border: "1px solid var(--card-border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--grey)" }}
                    formatter={(v) => [`${fmt(Number(v ?? 0))} ${UNITE[m]}`, LIBELLE[m]]}
                  />
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--accent)", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="focus-note">
              {LIBELLE[m]} sur les {pts.length} dernières séries
              {data.auPoidsDuCorps && " — au poids du corps, c'est le volume qui compte"}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
