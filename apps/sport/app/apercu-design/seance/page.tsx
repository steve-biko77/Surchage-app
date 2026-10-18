// Aperçu de la saisie et du focus perf, sans base de données.

"use client";

import { useEffect, useState } from "react";
import { LineChart } from "lucide-react";
import SaisieSerie from "@/components/SaisieSerie";
import FocusPerf from "@/components/FocusPerf";

/** Jeu de données figé, servi à la place de /api/progression dans l'aperçu. */
const PROGRESSION = {
  points: [
    { date: "2026-08-26", poids: 42.5, reps: 10, sets: 1, dureeSecondes: null, volume: 425, unRM: 56.6 },
    { date: "2026-09-02", poids: 45, reps: 10, sets: 1, dureeSecondes: null, volume: 450, unRM: 60 },
    { date: "2026-09-09", poids: 45, reps: 11, sets: 1, dureeSecondes: null, volume: 495, unRM: 61.5 },
    { date: "2026-09-16", poids: 47.5, reps: 9, sets: 1, dureeSecondes: null, volume: 427.5, unRM: 61.8 },
    { date: "2026-09-23", poids: 47.5, reps: 10, sets: 1, dureeSecondes: null, volume: 475, unRM: 63.3 },
    { date: "2026-09-30", poids: 50, reps: 8, sets: 1, dureeSecondes: null, volume: 400, unRM: 63.3 },
    { date: "2026-10-07", poids: 50, reps: 10, sets: 1, dureeSecondes: null, volume: 500, unRM: 66.7 },
    { date: "2026-10-15", poids: 50, reps: 10, sets: 1, dureeSecondes: null, volume: 500, unRM: 66.7 },
  ],
  metriquePrincipale: "poids" as const,
  auPoidsDuCorps: false,
  aDuree: false,
  deltas: { poids: 7.5, volume: 75, reps: 0, duree: 0 },
  nbSeances: 8,
  unRMMax: 66.7,
};

export default function ApercuSeance() {
  const [focus, setFocus] = useState(false);

  // Aperçu uniquement : /api/progression n'est pas joignable sans base.
  useEffect(() => {
    const vrai = window.fetch;
    window.fetch = ((url: RequestInfo | URL, init?: RequestInit) => {
      if (typeof url === "string" && url.startsWith("/api/progression")) {
        return Promise.resolve(
          new Response(JSON.stringify(PROGRESSION), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      return vrai(url, init);
    }) as typeof window.fetch;
    return () => {
      window.fetch = vrai;
    };
  }, []);

  return (
    <div>
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-widest text-[var(--grey)]">mardi</p>
        <h2 className="font-heading text-2xl font-bold leading-tight">Tirage vertical</h2>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--bg-card)]">
        <div className="p-4">
          <p className="text-xs text-[var(--chalk)]">
            <b className="font-heading text-[13px]">52,5 kg × 10</b>
            <span className="block text-[var(--grey)]">
              Tu as tenu 10 reps à 50 kg la dernière fois : on monte d&apos;un cran.
            </span>
          </p>
          <div className="mt-2">
            <button type="button" className="focus-bouton" onClick={() => setFocus(true)}>
              <LineChart className="h-3.5 w-3.5" aria-hidden="true" /> Mes perfs
            </button>
          </div>
        </div>

        <SaisieSerie
          exerciceId="apercu"
          auDuree={false}
          depart={{ poids: 52.5, reps: 10, dureeSec: 30 }}
          nbSeriesSuggere={3}
          derniereSeance={{
            date: "2026-10-15",
            series: [
              { poids: 50, reps: 10, sets: 1 },
              { poids: 50, reps: 10, sets: 1 },
              { poids: 50, reps: 8, sets: 1 },
            ],
          }}
          reposSec={90}
          simulation
        />
      </div>

      {focus && (
        <FocusPerf exerciceId="apercu" nom="Tirage vertical" onClose={() => setFocus(false)} />
      )}
    </div>
  );
}
