"use client";

import Model, { type IExerciseData } from "react-body-highlighter";
import { GROUPE_VERS_MUSCLES } from "./MuscleSilhouette";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";

const INTENSITE_COULEURS = ["#5a3420", "#c2410c", "#FF5A1F", "#ffb088"];

function frequenceDepuisSets(sets: number): number {
  if (sets <= 0) return 0;
  if (sets <= 4) return 1;
  if (sets <= 10) return 2;
  return 3;
}

export default function MuscleMap({ volumeParGroupe }: { volumeParGroupe: Record<string, number> }) {
  const anterior: IExerciseData[] = [];
  const posterior: IExerciseData[] = [];
  let totalSets = 0;

  for (const [groupe, config] of Object.entries(GROUPE_VERS_MUSCLES)) {
    const sets = volumeParGroupe[groupe] ?? 0;
    totalSets += sets;
    const frequency = frequenceDepuisSets(sets);
    if (frequency === 0) continue;
    const entry: IExerciseData = { name: groupe, muscles: config.muscles, frequency };
    (config.view === "anterior" ? anterior : posterior).push(entry);
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div>
          <CardTitle>Volume musculaire</CardTitle>
          <CardDescription>7 derniers jours</CardDescription>
        </div>
        <div className="flex items-center gap-1.5">
          {INTENSITE_COULEURS.slice(1).map((c, i) => (
            <span key={i} className="h-2 w-2 rounded-full" style={{ background: c }} aria-hidden="true" />
          ))}
          <span className="text-[10px] uppercase tracking-wide text-[var(--grey)] ml-1">Intensité</span>
        </div>
      </CardHeader>

      {totalSets === 0 ? (
        <p className="px-4 pb-4 pt-3 text-sm text-[var(--grey)]">
          Aucune série cette semaine — la carte s&apos;allumera dès ta première séance loggée.
        </p>
      ) : (
        <div className="flex items-center justify-center gap-2 px-2 pb-3">
          <div className="w-1/2 max-w-[140px]">
            <Model
              type="anterior"
              data={anterior}
              bodyColor="#2a2c34"
              highlightedColors={INTENSITE_COULEURS.slice(1)}
              style={{ width: "100%" }}
              svgStyle={{ width: "100%", height: "auto" }}
            />
            <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-[var(--grey)]">Face</p>
          </div>
          <div className="w-1/2 max-w-[140px]">
            <Model
              type="posterior"
              data={posterior}
              bodyColor="#2a2c34"
              highlightedColors={INTENSITE_COULEURS.slice(1)}
              style={{ width: "100%" }}
              svgStyle={{ width: "100%", height: "auto" }}
            />
            <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-[var(--grey)]">Dos</p>
          </div>
        </div>
      )}
    </Card>
  );
}
