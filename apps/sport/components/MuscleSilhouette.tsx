"use client";

// Vignette d'un exercice. Même tracé et même échelle que la carte d'accueil.
//
// Quand le nom de l'exercice est fourni, la vignette montre les muscles que
// CET exercice travaille (primaires en fort, secondaires en léger) plutôt que
// tout le groupe musculaire — un curl marteau et un curl pupitre n'allument
// plus la même chose.

import { useId, useMemo } from "react";
import CorpsSvg, { meilleureVue } from "./anatomie/CorpsSvg";
import {
  GROUPE_VERS_REGIONS,
  GROUPE_LABELS,
  MUSCLE_VERS_REGIONS,
  type BaseRegion,
  type NiveauVolume,
} from "@/lib/domain/anatomie";
import { musclesExercice } from "@/lib/domain/referentielExercices";
import type { GroupeMusculaire } from "@/lib/domain/types";

export default function MuscleSilhouette({ groupe, nom }: { groupe: string; nom?: string }) {
  const uid = useId().replace(/:/g, "");

  const calc = useMemo(() => {
    const g = groupe as GroupeMusculaire;

    if (nom) {
      const m = musclesExercice(nom, g);
      const map: Record<BaseRegion, NiveauVolume> = {};
      const set = new Set<BaseRegion>();
      // Secondaires d'abord : un muscle des deux listes finit au palier primaire.
      for (const mus of m.secondaires) {
        for (const r of MUSCLE_VERS_REGIONS[mus] ?? []) { map[r] = 2; set.add(r); }
      }
      for (const mus of m.primaires) {
        for (const r of MUSCLE_VERS_REGIONS[mus] ?? []) { map[r] = 4; set.add(r); }
      }
      if (set.size > 0) return { vue: meilleureVue(set), intensites: map };
    }

    const regions = GROUPE_VERS_REGIONS[g];
    if (!regions) return null;
    const map: Record<BaseRegion, NiveauVolume> = {};
    for (const r of regions) map[r] = 4;
    return { vue: meilleureVue(new Set(regions)), intensites: map };
  }, [groupe, nom]);

  if (!calc) {
    return <div className="h-20 w-14 shrink-0 rounded-lg bg-[var(--bg-card-2)]" aria-hidden="true" />;
  }

  return (
    <div
      className="relative flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
      style={{ background: "radial-gradient(circle at 50% 35%, rgba(var(--accent-rgb),0.14), transparent 70%)" }}
    >
      <CorpsSvg
        vue={calc.vue}
        uid={uid}
        intensites={calc.intensites}
        hauteur="76px"
        halo={false}
        titre={
          nom
            ? `Muscles travaillés par ${nom}`
            : `Zone travaillée : ${GROUPE_LABELS[groupe as GroupeMusculaire] ?? groupe}`
        }
      />
    </div>
  );
}
