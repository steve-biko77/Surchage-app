// Aperçu de la saisie, sans base de données (mode simulation).

"use client";

import SaisieSerie from "@/components/SaisieSerie";

export default function ApercuSeance() {
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
    </div>
  );
}
