// Coeur de domaine - types purs, aucune dependance a Drizzle/Postgres/React
// Correspond au diagramme de classes (chapitre IV, Figure 1)

export type JourSemaine =
  | "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi" | "dimanche";

export type GroupeMusculaire =
  | "dos" | "biceps" | "triceps" | "epaules" | "pectoraux"
  | "jambes" | "avant-bras" | "abdominaux" | "mollets";

export type TypeCharge = "haltere" | "poulie" | "barre" | "poids_du_corps";

export type UniteMesure = "repetitions" | "duree";

export interface Discipline {
  id: string;
  nom: string;
  couleur: string;
}

export type TypeObjectif = "temps" | "performance";

export interface Objectif {
  id: string;
  nom: string;
  disciplineId: string | null;
  heuresCible: number;
  minutesInvesties: number;
  deadline: string | null;
  type: TypeObjectif;
  poidsCible: number | null;
}

export interface Programme {
  id: string;
  nom: string;
  jourSemaine: JourSemaine;
  disciplineId: string | null;
}

export interface Exercice {
  id: string;
  nom: string;
  programmeId: string | null;
  groupeMusculaire: GroupeMusculaire;
  prioritaire: boolean;
  ordre: number;
  repPlancher: number;
  repPlafond: number;
  typeCharge: TypeCharge;
  uniteMesure: UniteMesure;
  dureePlancherSec: number | null;
  dureePlafondSec: number | null;
}

export interface Serie {
  id: string;
  date: string;
  exerciceId: string;
  poids: number;
  reps: number;
  sets: number;
  dureeSecondes: number | null;
  note: string | null;
  source: string; // "manuel" | "strava" | "boditrax" (Phase 4) - non contraint au type DB genere par Drizzle
}

export type CibleAuto =
  | { mode: "reps"; poidsCible: number; repsCible: number; justification: string }
  | { mode: "duree"; dureeCibleSec: number; justification: string };

export type MuscleDetail =
  | "deltoide_anterieur" | "deltoide_lateral" | "deltoide_posterieur" | "trapeze"
  | "grand_dorsal" | "pectoraux" | "biceps" | "triceps" | "avant_bras" | "abdominaux" | "obliques"
  | "quadriceps" | "ischio_jambiers" | "fessiers" | "mollets";

export type RoleMuscle = "primaire" | "secondaire";

export interface ExerciceMuscle {
  exerciceId: string;
  muscle: MuscleDetail;
  role: RoleMuscle;
}

export type StatutSeancePlanifiee = "planifiee" | "realisee";

export interface SeancePlanifiee {
  id: string;
  date: string;
  nom: string;
  disciplineId: string | null;
  exerciceIds: string[];
  statut: StatutSeancePlanifiee;
  source: string; // "manuel" | "ia" (Phase 4)
}
