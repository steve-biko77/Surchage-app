"use client";

// « Zone ciblée » d'un exercice : les muscles primaires sont allumés au palier
// haut, les secondaires à un palier intermédiaire. Même tracé que la carte
// d'accueil, et seules les vues qui montrent réellement un muscle sollicité
// sont affichées — inutile de montrer un dos éteint pour un curl.

import { useId, useMemo } from "react";
import { Target } from "lucide-react";
import CorpsSvg, { vueMontre, type Vue } from "./anatomie/CorpsSvg";
import { MUSCLE_VERS_REGIONS, type BaseRegion, type NiveauVolume } from "@/lib/domain/anatomie";
import { MUSCLE_LABELS } from "@/lib/domain/muscleMapping";
import type { MuscleDetail, RoleMuscle } from "@/lib/domain/types";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";

export default function MuscleMapDetail({
  muscles,
}: {
  muscles: Array<{ muscle: MuscleDetail; role: RoleMuscle }>;
}) {
  const uid = useId().replace(/:/g, "");

  const { intensites, vues } = useMemo(() => {
    const map: Record<BaseRegion, NiveauVolume> = {};
    const set = new Set<BaseRegion>();
    // Les secondaires d'abord : un muscle à la fois primaire et secondaire
    // doit finir au palier primaire.
    for (const role of ["secondaire", "primaire"] as const) {
      for (const m of muscles.filter((x) => x.role === role)) {
        for (const r of MUSCLE_VERS_REGIONS[m.muscle] ?? []) {
          map[r] = role === "primaire" ? 4 : 2;
          set.add(r);
        }
      }
    }
    const v = (["face", "dos"] as Vue[]).filter((x) => vueMontre(x, set));
    return { intensites: map, vues: v.length > 0 ? v : (["face"] as Vue[]) };
  }, [muscles]);

  if (muscles.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Zone ciblée</CardTitle>
        </CardHeader>
        <p className="px-4 pb-4 text-sm text-[var(--grey)]">
          Détail musculaire non renseigné pour cet exercice.
        </p>
      </Card>
    );
  }

  const primaires = muscles.filter((m) => m.role === "primaire");
  const secondaires = muscles.filter((m) => m.role === "secondaire");

  return (
    <Card>
      <CardHeader className="pb-0">
        <div>
          <CardTitle className="flex items-center gap-1.5">
            <Target className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
            Zone ciblée
          </CardTitle>
          <CardDescription>Muscles primaires et secondaires</CardDescription>
        </div>
      </CardHeader>

      <div className="flex items-center justify-center gap-5 px-2 py-4">
        {vues.map((v) => (
          <div key={v} className="flex flex-col items-center">
            {/* Pas de `surlignes` ici : il repeint toutes les portions dans la
                même teinte de surlignage et écrase la distinction primaire /
                secondaire. Ce sont les paliers (4 vs 2) qui la portent. */}
            <CorpsSvg
              vue={v}
              uid={uid}
              intensites={intensites}
              hauteur="var(--fiche-corps-h, 190px)"
              titre={`Muscles sollicités, vue ${v === "face" ? "de face" : "de dos"}`}
            />
            <p className="mt-1.5 text-[10px] uppercase tracking-widest text-[var(--grey)]">
              {v === "face" ? "Face" : "Dos"}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        {primaires.map((m) => (
          <span
            key={m.muscle}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-wash)] px-2.5 py-1 text-[11px] font-medium text-[var(--chalk)]"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--anat-4)]" aria-hidden="true" />
            {MUSCLE_LABELS[m.muscle]}
          </span>
        ))}
        {secondaires.map((m) => (
          <span
            key={m.muscle}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--steel)] bg-black/15 px-2.5 py-1 text-[11px] text-[var(--grey)]"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--anat-2)]" aria-hidden="true" />
            {MUSCLE_LABELS[m.muscle]}
          </span>
        ))}
      </div>
    </Card>
  );
}
