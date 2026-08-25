"use client";

import Model, { type IExerciseData } from "react-body-highlighter";
import { Target } from "lucide-react";
import { MUSCLE_LABELS, MUSCLE_VERS_LIB } from "@/lib/domain/muscleMapping";
import type { MuscleDetail, RoleMuscle } from "@/lib/domain/types";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";

const COULEUR_PRIMAIRE = "#FF5A1F";
const COULEUR_SECONDAIRE = "#c2410c";
// index 0 = frequence 1 (secondaire), index 1 = frequence 2 (primaire) - cf. react-body-highlighter
const HIGHLIGHTED_COLORS = [COULEUR_SECONDAIRE, COULEUR_PRIMAIRE];

export default function MuscleMapDetail({ muscles }: { muscles: Array<{ muscle: MuscleDetail; role: RoleMuscle }> }) {
  if (muscles.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle>Zone ciblée</CardTitle></CardHeader>
        <p className="px-4 pb-4 text-sm text-[var(--grey)]">Détail musculaire non renseigné pour cet exercice.</p>
      </Card>
    );
  }

  const anterior: IExerciseData[] = [];
  const posterior: IExerciseData[] = [];

  for (const role of ["secondaire", "primaire"] as const) {
    const slugs = muscles
      .filter((m) => m.role === role)
      .map((m) => MUSCLE_VERS_LIB[m.muscle]);
    const parVue = { anterior: slugs.filter((s) => s.view === "anterior").map((s) => s.slug), posterior: slugs.filter((s) => s.view === "posterior").map((s) => s.slug) };
    const frequency = role === "primaire" ? 2 : 1;
    if (parVue.anterior.length > 0) anterior.push({ name: role, muscles: parVue.anterior, frequency });
    if (parVue.posterior.length > 0) posterior.push({ name: role, muscles: parVue.posterior, frequency });
  }

  const primaires = muscles.filter((m) => m.role === "primaire");
  const secondaires = muscles.filter((m) => m.role === "secondaire");

  return (
    <Card>
      <CardHeader className="pb-0">
        <div>
          <CardTitle className="flex items-center gap-1.5"><Target className="h-4 w-4 text-[#FF5A1F]" aria-hidden="true" />Zone ciblée</CardTitle>
          <CardDescription>Muscles primaires et secondaires</CardDescription>
        </div>
      </CardHeader>

      <div className="flex items-center justify-center gap-2 px-2 py-3">
        <div className="w-1/2 max-w-[150px]">
          <Model type="anterior" data={anterior} bodyColor="#2a2c34" highlightedColors={HIGHLIGHTED_COLORS} style={{ width: "100%" }} svgStyle={{ width: "100%", height: "auto" }} />
          <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-[var(--grey)]">Face</p>
        </div>
        <div className="w-1/2 max-w-[150px]">
          <Model type="posterior" data={posterior} bodyColor="#2a2c34" highlightedColors={HIGHLIGHTED_COLORS} style={{ width: "100%" }} svgStyle={{ width: "100%", height: "auto" }} />
          <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-[var(--grey)]">Dos</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        {primaires.map((m) => (
          <span key={m.muscle} className="inline-flex items-center gap-1.5 rounded-full border border-[#FF5A1F]/40 bg-[#2a1c10] px-2.5 py-1 text-[11px] font-medium text-[#ffd8c2]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COULEUR_PRIMAIRE }} aria-hidden="true" />
            {MUSCLE_LABELS[m.muscle]}
          </span>
        ))}
        {secondaires.map((m) => (
          <span key={m.muscle} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--steel)] bg-black/15 px-2.5 py-1 text-[11px] text-[var(--grey)]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COULEUR_SECONDAIRE }} aria-hidden="true" />
            {MUSCLE_LABELS[m.muscle]}
          </span>
        ))}
      </div>
    </Card>
  );
}
