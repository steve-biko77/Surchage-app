"use client";

// Vignette d'un exercice. Même tracé et même échelle que la carte d'accueil.
//
// Quand le nom de l'exercice est fourni, la vignette montre les muscles que
// CET exercice travaille (primaires en fort, secondaires en léger) plutôt que
// tout le groupe musculaire — un curl marteau et un curl pupitre n'allument
// plus la même chose.
//
// La vignette est RECADRÉE sur ces muscles. Un corps entier dans 56 px de
// large laissait le grand dorsal à une dizaine de pixels : on voyait une
// tache colorée, pas un muscle. On garde assez de contexte autour pour
// reconnaître la zone du corps, et on approche le reste.

import { useId, useMemo } from "react";
import CorpsSvg, { meilleureVue, VIEWBOX } from "./anatomie/CorpsSvg";
import {
  GROUPE_VERS_REGIONS,
  GROUPE_LABELS,
  MUSCLE_VERS_REGIONS,
  type BaseRegion,
  type NiveauVolume,
} from "@/lib/domain/anatomie";
import { boiteDeRegions, fenetreSur } from "@/lib/domain/cadrage";
import { musclesExercice } from "@/lib/domain/referentielExercices";
import type { GroupeMusculaire } from "@/lib/domain/types";

/** Proportions de la vignette (56 × 80 px) : la fenêtre les adopte. */
const RATIO_VIGNETTE = 56 / 80;

export default function MuscleSilhouette({ groupe, nom }: { groupe: string; nom?: string }) {
  const uid = useId().replace(/:/g, "");

  const calc = useMemo(() => {
    const g = groupe as GroupeMusculaire;

    const cadrer = (vue: "face" | "dos", cibles: Set<BaseRegion>) =>
      fenetreSur(VIEWBOX[vue], boiteDeRegions(vue, cibles), {
        marge: 0.3,
        zoomMax: 2.9,
        ratio: RATIO_VIGNETTE,
      });

    if (nom) {
      const m = musclesExercice(nom, g);
      const map: Record<BaseRegion, NiveauVolume> = {};
      const set = new Set<BaseRegion>();
      const primaires = new Set<BaseRegion>();
      // Secondaires d'abord : un muscle des deux listes finit au palier primaire.
      for (const mus of m.secondaires) {
        for (const r of MUSCLE_VERS_REGIONS[mus] ?? []) { map[r] = 2; set.add(r); }
      }
      for (const mus of m.primaires) {
        for (const r of MUSCLE_VERS_REGIONS[mus] ?? []) { map[r] = 4; set.add(r); primaires.add(r); }
      }
      if (set.size > 0) {
        // La vue se choisit sur les PRIMAIRES, pas sur l'ensemble : ce sont
        // eux qu'on vient lire. Décider sur l'ensemble pouvait basculer la
        // vue à cause des secondaires et n'y laisser aucun primaire à
        // cadrer — les élévations latérales retombaient alors sur le corps
        // entier, aussi illisibles qu'avant.
        const vue = meilleureVue(primaires.size > 0 ? primaires : set);
        const boite =
          boiteDeRegions(vue, primaires.size > 0 ? primaires : set) ?? boiteDeRegions(vue, set);
        return {
          vue,
          intensites: map,
          fenetre: fenetreSur(VIEWBOX[vue], boite, {
            marge: 0.3,
            zoomMax: 2.9,
            ratio: RATIO_VIGNETTE,
          }),
        };
      }
    }

    const regions = GROUPE_VERS_REGIONS[g];
    if (!regions) return null;
    const map: Record<BaseRegion, NiveauVolume> = {};
    for (const r of regions) map[r] = 4;
    const ens = new Set(regions);
    const vue = meilleureVue(ens);
    return { vue, intensites: map, fenetre: cadrer(vue, ens) };
  }, [groupe, nom]);

  if (!calc) {
    return <div className="h-20 w-14 shrink-0 rounded-lg bg-[var(--bg-card-2)]" aria-hidden="true" />;
  }

  return (
    <div
      className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg"
      style={{ background: "radial-gradient(circle at 50% 35%, rgba(var(--accent-rgb),0.16), transparent 72%)" }}
    >
      <CorpsSvg
        vue={calc.vue}
        uid={uid}
        intensites={calc.intensites}
        fenetre={calc.fenetre}
        remplir
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
