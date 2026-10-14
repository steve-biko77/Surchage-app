// Couche anatomique : relie le domaine (GroupeMusculaire, MuscleDetail) aux
// regions du trace SVG `body-muscles` (Apache-2.0, cf. NOTICE a la racine de l'app).
//
// Le trace distingue des PORTIONS que le domaine ne connait pas encore
// (triceps long vs lateral, traps haut/moyen/bas, gastrocnemien median vs
// lateral...). On les expose ici pour que la carte puisse les allumer
// separement des que les exercices porteront l'information ; en attendant,
// un groupe allume toutes ses portions d'un bloc.

import type { GroupeMusculaire, MuscleDetail } from "./types";

/** Nom de region sans le suffixe de cote : "triceps-long", pas "triceps-long-left". */
export type BaseRegion = string;

/** Libelle FR affiche au survol d'une portion. */
export const REGION_LABELS: Record<BaseRegion, string> = {
  // Epaules
  "shoulder-front": "Deltoïde antérieur",
  "shoulder-side": "Deltoïde latéral",
  "deltoid-rear": "Deltoïde postérieur",
  // Dos
  "traps-upper": "Trapèze supérieur",
  "traps-mid": "Trapèze moyen",
  "traps-lower": "Trapèze inférieur",
  "lats-upper": "Grand dorsal — faisceau supérieur",
  "lats-mid": "Grand dorsal — faisceau moyen",
  "lats-lower": "Grand dorsal — faisceau inférieur",
  "lower-back-erectors": "Érecteurs du rachis",
  "lower-back-ql": "Carré des lombes",
  // Pectoraux
  "chest-upper": "Pectoral — faisceau claviculaire",
  "chest-lower": "Pectoral — faisceau sternocostal",
  // Bras
  biceps: "Biceps brachial",
  "triceps-long": "Triceps — longue portion",
  "triceps-lateral": "Triceps — vaste latéral",
  forearm: "Avant-bras",
  "forearm-flexors": "Avant-bras — fléchisseurs",
  "forearm-extensors": "Avant-bras — extenseurs",
  // Tronc
  "abs-upper": "Grand droit — portion haute",
  "abs-lower": "Grand droit — portion basse",
  obliques: "Obliques",
  "serratus-anterior": "Dentelé antérieur",
  "hip-flexor": "Fléchisseurs de hanche",
  // Jambes
  quads: "Quadriceps",
  adductors: "Adducteurs",
  "hamstrings-medial": "Ischio-jambiers — faisceau médial",
  "hamstrings-lateral": "Ischio-jambiers — faisceau latéral",
  "gluteus-maximus": "Grand fessier",
  "gluteus-medius": "Moyen fessier",
  "calves-gastroc-medial": "Gastrocnémien médial",
  "calves-gastroc-lateral": "Gastrocnémien latéral",
  "calves-soleus": "Soléaire",
  "tibialis-anterior": "Tibial antérieur",
};

/**
 * Regions non entrainables : tete, mains, pieds, articulations, colonne.
 * Elles restent dans le trace pour que la silhouette soit complete, mais ne
 * portent ni intensite, ni interaction.
 */
export const REGIONS_INERTES = new Set<BaseRegion>([
  "head", "face", "head-back", "nape", "neck",
  "hand", "hand-back", "foot", "foot-back",
  "elbow", "knee", "knee-back", "spine",
]);

/** Groupe du domaine -> portions a allumer. */
export const GROUPE_VERS_REGIONS: Record<GroupeMusculaire, BaseRegion[]> = {
  dos: [
    "traps-upper", "traps-mid", "traps-lower",
    "lats-upper", "lats-mid", "lats-lower",
    "lower-back-erectors", "lower-back-ql",
  ],
  biceps: ["biceps"],
  triceps: ["triceps-long", "triceps-lateral"],
  epaules: ["shoulder-front", "shoulder-side", "deltoid-rear"],
  pectoraux: ["chest-upper", "chest-lower"],
  jambes: [
    "quads", "adductors",
    "hamstrings-medial", "hamstrings-lateral",
    "gluteus-maximus", "gluteus-medius",
  ],
  "avant-bras": ["forearm", "forearm-flexors", "forearm-extensors"],
  abdominaux: ["abs-upper", "abs-lower", "obliques", "serratus-anterior"],
  mollets: [
    "calves-gastroc-medial", "calves-gastroc-lateral",
    "calves-soleus", "tibialis-anterior",
  ],
};

/** Muscle detaille (reference exercice) -> portions. Plus fin que le groupe. */
export const MUSCLE_VERS_REGIONS: Record<MuscleDetail, BaseRegion[]> = {
  deltoide_anterieur: ["shoulder-front"],
  deltoide_lateral: ["shoulder-side"],
  deltoide_posterieur: ["deltoid-rear"],
  trapeze: ["traps-upper", "traps-mid", "traps-lower"],
  grand_dorsal: ["lats-upper", "lats-mid", "lats-lower"],
  pectoraux: ["chest-upper", "chest-lower"],
  biceps: ["biceps"],
  triceps: ["triceps-long", "triceps-lateral"],
  avant_bras: ["forearm", "forearm-flexors", "forearm-extensors"],
  abdominaux: ["abs-upper", "abs-lower"],
  obliques: ["obliques", "serratus-anterior"],
  quadriceps: ["quads"],
  ischio_jambiers: ["hamstrings-medial", "hamstrings-lateral"],
  fessiers: ["gluteus-maximus", "gluteus-medius"],
  mollets: ["calves-gastroc-medial", "calves-gastroc-lateral", "calves-soleus"],
};

/** Portion -> groupe du domaine. Index inverse, pour remonter d'un clic au groupe. */
export const REGION_VERS_GROUPE: Record<BaseRegion, GroupeMusculaire> = (() => {
  const index: Record<BaseRegion, GroupeMusculaire> = {};
  for (const [groupe, regions] of Object.entries(GROUPE_VERS_REGIONS)) {
    for (const r of regions) index[r] = groupe as GroupeMusculaire;
  }
  return index;
})();

/** Libelle FR des groupes, pour les titres et le panneau de detail. */
export const GROUPE_LABELS: Record<GroupeMusculaire, string> = {
  dos: "Dos",
  biceps: "Biceps",
  triceps: "Triceps",
  epaules: "Épaules",
  pectoraux: "Pectoraux",
  jambes: "Jambes",
  "avant-bras": "Avant-bras",
  abdominaux: "Abdominaux",
  mollets: "Mollets",
};

/** Retire le suffixe de cote d'un id de region du trace. */
export function baseDeRegion(id: string): BaseRegion {
  return id.replace(/-(left|right)$/, "");
}

/** 5 paliers de volume hebdomadaire, en series travaillees. */
export const PALIERS_VOLUME = [0, 1, 4, 8, 14] as const;
export type NiveauVolume = 0 | 1 | 2 | 3 | 4;

/**
 * Series d'un groupe sur 7 jours -> palier d'intensite.
 * Les seuils suivent les recommandations de volume hebdomadaire par groupe
 * (~10 series = volume d'entretien, ~14+ = volume de prise).
 */
export function niveauDepuisSets(sets: number): NiveauVolume {
  if (sets <= 0) return 0;
  if (sets < 4) return 1;
  if (sets < 8) return 2;
  if (sets < 14) return 3;
  return 4;
}

export const LIBELLES_NIVEAU: Record<NiveauVolume, string> = {
  0: "Non sollicité",
  1: "Volume faible",
  2: "Volume modéré",
  3: "Volume soutenu",
  4: "Volume élevé",
};

/** Intensite par portion, calculee depuis les series reelles agregees par groupe. */
export function intensitesParRegion(
  volumeParGroupe: Record<string, number>
): Record<BaseRegion, NiveauVolume> {
  const out: Record<BaseRegion, NiveauVolume> = {};
  for (const [groupe, regions] of Object.entries(GROUPE_VERS_REGIONS)) {
    const niveau = niveauDepuisSets(volumeParGroupe[groupe] ?? 0);
    for (const r of regions) out[r] = niveau;
  }
  return out;
}
