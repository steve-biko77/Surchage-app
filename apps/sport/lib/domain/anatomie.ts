// Couche anatomique : relie le domaine (GroupeMusculaire, MuscleDetail) aux
// régions du tracé Open-Muscle-Map (MIT, cf. lib/anatomie/omm/LICENSE).
//
// Le tracé précédent (body-muscles) était facetté : des polygones à plat qui,
// réduits à la taille d'une vignette, ne ressemblaient plus à un muscle. Celui-ci
// est dessiné sur de vrais contours. Il est aussi plus fin là où ça compte pour
// un entraînement — trois chefs de quadriceps, gastrocnémien et soléaire
// séparés, quatre segments de grand droit — et porte ses propres boîtes
// englobantes, dont le recadrage se sert directement.
//
// Une région ici est un `muscleId` du tracé. Les sous-portions existent dans
// les données (trapèze supérieur, grand droit haut...) mais ne servent qu'à
// l'affichage : le domaine raisonne au muscle, pas au faisceau, et allumer un
// muscle allume toutes ses portions.

import type { GroupeMusculaire, MuscleDetail } from "./types";

/** Identifiant de muscle du tracé : "latissimus_dorsi", "vastus_medialis"... */
export type BaseRegion = string;

/** Libellé FR affiché au survol d'une portion. */
export const REGION_LABELS: Record<BaseRegion, string> = {
  // Épaules
  // Le sterno-cléido-mastoïdien est volontairement absent : le tracé le
  // dessine, mais aucun groupe du domaine ne l'entraîne. Sans libellé il
  // devient inerte, donc ni coloré ni cliquable — plutôt qu'un muscle qu'on
  // survole pour rien.
  anterior_deltoid: "Deltoïde antérieur",
  lateral_deltoid: "Deltoïde latéral",
  posterior_deltoid: "Deltoïde postérieur",
  posterior_rotator_cuff: "Coiffe des rotateurs",
  // Dos
  trapezius: "Trapèze",
  latissimus_dorsi: "Grand dorsal",
  erector_spinae: "Érecteurs du rachis",
  // Buste
  pectoralis_major: "Pectoral",
  serratus_anterior: "Dentelé antérieur",
  rectus_abdominis: "Grand droit",
  external_oblique: "Oblique externe",
  // Bras
  biceps_brachii: "Biceps brachial",
  brachialis: "Brachial antérieur",
  triceps_brachii: "Triceps brachial",
  forearm_flexors: "Avant-bras — fléchisseurs",
  forearm_extensors: "Avant-bras — extenseurs",
  // Hanche et cuisse
  iliopsoas: "Psoas-iliaque",
  tensor_fasciae_latae: "Tenseur du fascia lata",
  sartorius: "Couturier",
  hip_adductors: "Adducteurs",
  rectus_femoris: "Droit fémoral",
  vastus_lateralis: "Vaste latéral",
  vastus_medialis: "Vaste médial",
  gluteus_maximus: "Grand fessier",
  gluteus_medius: "Moyen fessier",
  biceps_femoris: "Biceps fémoral",
  medial_hamstrings: "Ischio-jambiers médiaux",
  // Jambe
  gastrocnemius: "Gastrocnémien",
  soleus: "Soléaire",
  tibialis_anterior: "Tibial antérieur",
  fibularis_group: "Fibulaires",
};

/**
 * Régions non entraînables : articulations, tendons, fascia. Elles restent
 * dessinées pour que le corps soit complet, mais ne portent ni intensité ni
 * interaction. Le tracé les marque lui-même `selectable: false` — cette liste
 * n'est qu'un garde-fou lisible, la source de vérité reste la donnée.
 */
export const REGIONS_INERTES = new Set<BaseRegion>([
  "patella_region",
  "patellar_tendon_region",
  "popliteal_region",
  "achilles_tendon",
  "iliotibial_tract",
]);

/** Groupe du domaine -> muscles à allumer. */
export const GROUPE_VERS_REGIONS: Record<GroupeMusculaire, BaseRegion[]> = {
  dos: ["trapezius", "latissimus_dorsi", "erector_spinae", "posterior_rotator_cuff"],
  biceps: ["biceps_brachii", "brachialis"],
  triceps: ["triceps_brachii"],
  epaules: ["anterior_deltoid", "lateral_deltoid", "posterior_deltoid"],
  pectoraux: ["pectoralis_major"],
  jambes: [
    "rectus_femoris", "vastus_lateralis", "vastus_medialis",
    "hip_adductors", "tensor_fasciae_latae", "sartorius",
    "biceps_femoris", "medial_hamstrings",
    "gluteus_maximus", "gluteus_medius",
  ],
  "avant-bras": ["forearm_flexors", "forearm_extensors"],
  // Le psoas-iliaque travaille sur tout relevé de jambes : il appartient au
  // bloc abdominaux côté entraînement, même si l'anatomie le classe ailleurs.
  abdominaux: ["rectus_abdominis", "external_oblique", "serratus_anterior", "iliopsoas"],
  mollets: ["gastrocnemius", "soleus", "tibialis_anterior", "fibularis_group"],
};

/** Muscle détaillé (référentiel exercices) -> muscles du tracé. */
export const MUSCLE_VERS_REGIONS: Record<MuscleDetail, BaseRegion[]> = {
  deltoide_anterieur: ["anterior_deltoid"],
  deltoide_lateral: ["lateral_deltoid"],
  deltoide_posterieur: ["posterior_deltoid"],
  trapeze: ["trapezius"],
  grand_dorsal: ["latissimus_dorsi"],
  pectoraux: ["pectoralis_major"],
  // Le brachial travaille sur tout curl : le tracé le distingue, autant le dire.
  biceps: ["biceps_brachii", "brachialis"],
  triceps: ["triceps_brachii"],
  avant_bras: ["forearm_flexors", "forearm_extensors"],
  abdominaux: ["rectus_abdominis"],
  obliques: ["external_oblique", "serratus_anterior"],
  // Trois chefs distincts, là où l'ancien tracé n'avait qu'un bloc "quads".
  quadriceps: ["rectus_femoris", "vastus_lateralis", "vastus_medialis"],
  ischio_jambiers: ["biceps_femoris", "medial_hamstrings"],
  fessiers: ["gluteus_maximus", "gluteus_medius"],
  mollets: ["gastrocnemius", "soleus"],
};

/** Portion -> groupe du domaine. Index inverse, pour remonter d'un clic au groupe. */
export const REGION_VERS_GROUPE: Record<BaseRegion, GroupeMusculaire> = (() => {
  const index: Record<BaseRegion, GroupeMusculaire> = {};
  for (const [groupe, regions] of Object.entries(GROUPE_VERS_REGIONS)) {
    for (const r of regions) index[r] = groupe as GroupeMusculaire;
  }
  return index;
})();

/** Libellé FR des groupes, pour les titres et le panneau de détail. */
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

/**
 * Région de base d'une clé de portion : "trapezius:upper" -> "trapezius".
 * Le domaine raisonne au muscle ; la sous-portion ne sert qu'à l'affichage.
 */
export function baseDeRegion(cle: string): BaseRegion {
  const i = cle.indexOf(":");
  return i === -1 ? cle : cle.slice(0, i);
}

/** 5 paliers de volume hebdomadaire, en séries travaillées. */
export const PALIERS_VOLUME = [0, 1, 4, 8, 14] as const;
export type NiveauVolume = 0 | 1 | 2 | 3 | 4;

/**
 * Séries d'un groupe sur 7 jours -> palier d'intensité.
 * Les seuils suivent les recommandations de volume hebdomadaire par groupe
 * (~10 séries = volume d'entretien, ~14+ = volume de prise).
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

/** Intensité par portion, calculée depuis les séries réelles agrégées par groupe. */
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
