// Reconstruit les instances de domaine (@productivity/core) a partir des colonnes DB.
import { DisciplineCheckIn, ObjectifMetrique, ObjectifTemps, type Discipline, type Objectif } from "@productivity/core";

export interface DisciplineRow {
  id: string;
  nom: string;
  icone: string;
  couleur: string;
  type: string;
}

/**
 * Toute discipline Journal est un simple check-in journalier, y compris celle
 * nommee "Sport" -- elle ne duplique jamais DisciplineSport (specifique a
 * apps/sport et a sa logique de volume de series). Le champ `type` en base
 * ("checkin" | "sport") est conserve pour l'affichage/futur usage, pas pour
 * choisir la sous-classe.
 */
export function disciplineDepuisRow(row: DisciplineRow): Discipline {
  return new DisciplineCheckIn(row.id, row.nom, row.couleur, row.icone);
}

export interface ObjectifRow {
  id: string;
  nom: string;
  type: string;
  disciplineId: string | null;
  deadline: string | null;
  heuresCible: number | null;
  minutesInvesties: number;
  unite: string | null;
  valeurDepart: number | null;
  valeurCible: number | null;
  valeurActuelle: number | null;
  sens: string | null;
}

export function objectifDepuisRow(row: ObjectifRow): Objectif {
  if (row.type === "metrique") {
    return new ObjectifMetrique(
      row.id,
      row.nom,
      row.disciplineId ?? "",
      row.deadline,
      row.unite ?? "",
      row.valeurDepart ?? 0,
      row.valeurCible ?? 0,
      row.valeurActuelle ?? 0,
      row.sens === "decroissant" ? "decroissant" : "croissant"
    );
  }
  return new ObjectifTemps(
    row.id,
    row.nom,
    row.disciplineId ?? "",
    row.deadline,
    row.heuresCible ?? 0,
    row.minutesInvesties
  );
}
