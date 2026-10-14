"use client";

// Vignette d'un groupe musculaire. Même tracé et même échelle que la carte
// d'accueil : l'app n'a plus qu'une seule anatomie.

import { useId, useMemo } from "react";
import CorpsSvg, { meilleureVue } from "./anatomie/CorpsSvg";
import { GROUPE_VERS_REGIONS, GROUPE_LABELS, type BaseRegion, type NiveauVolume } from "@/lib/domain/anatomie";
import type { GroupeMusculaire } from "@/lib/domain/types";

export default function MuscleSilhouette({ groupe }: { groupe: string }) {
  const uid = useId().replace(/:/g, "");
  const regions = GROUPE_VERS_REGIONS[groupe as GroupeMusculaire];

  const { vue, intensites, surlignes } = useMemo(() => {
    const set = new Set<BaseRegion>(regions ?? []);
    const map: Record<BaseRegion, NiveauVolume> = {};
    for (const r of set) map[r] = 4;
    return { vue: meilleureVue(set), intensites: map, surlignes: set };
  }, [regions]);

  if (!regions) {
    return <div className="h-20 w-14 shrink-0 rounded-lg bg-[var(--bg-card-2)]" aria-hidden="true" />;
  }

  return (
    <div
      className="relative flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
      style={{ background: "radial-gradient(circle at 50% 35%, rgba(var(--accent-rgb),0.14), transparent 70%)" }}
    >
      <CorpsSvg
        vue={vue}
        uid={uid}
        intensites={intensites}
        surlignes={surlignes}
        hauteur="76px"
        halo={false}
        titre={`Zone travaillée : ${GROUPE_LABELS[groupe as GroupeMusculaire] ?? groupe}`}
      />
    </div>
  );
}
