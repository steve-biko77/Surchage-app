// Coeur de domaine - types purs, aucune dependance a Drizzle/Postgres/React
// Correspond au diagramme de classes (chapitre IV, Figure 1)

export type JourSemaine =
  | "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi" | "dimanche";

export type GroupeMusculaire =
  | "dos" | "biceps" | "triceps" | "epaules" | "pectoraux"
  | "jambes" | "avant-bras" | "abdominaux" | "mollets";

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
  exerciceId: string | null;
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
  objectifId: string | null;
  ordre: number;
  incrementKg: number;
  repPlancher: number;
  repPlafond: number;
}

export interface Serie {
  id: string;
  date: string;
  exerciceId: string;
  poids: number;
  reps: number;
  sets: number;
  note: string | null;
  source: string; // "manuel" | "strava" | "boditrax" (Phase 4) - non contraint au type DB genere par Drizzle
}

export interface CibleAuto {
  poidsCible: number;
  repsCible: number;
  justification: string;
}
