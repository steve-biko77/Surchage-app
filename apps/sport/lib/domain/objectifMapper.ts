// Reconstruit les instances de domaine (@productivity/core) a partir des colonnes
// existantes en base - le schema DB ne change pas, seule la couche domaine change.
import { ObjectifPerformance, ObjectifTemps, type Objectif } from "@productivity/core";

export interface ObjectifRow {
  id: string;
  nom: string;
  disciplineId: string | null;
  heuresCible: number;
  minutesInvesties: number;
  deadline: string | null;
  type: string;
  poidsCible: number | null;
}

/**
 * Reconstruit ObjectifTemps ou ObjectifPerformance selon la colonne `type`.
 * `meilleurPoidsAtteint` doit etre fourni par l'appelant pour les objectifs
 * performance (calcule a partir des series des exercices lies).
 */
export function objectifDepuisRow(row: ObjectifRow, meilleurPoidsAtteint = 0): Objectif {
  if (row.type === "performance") {
    return new ObjectifPerformance(
      row.id,
      row.nom,
      row.disciplineId ?? "",
      row.deadline,
      row.poidsCible ?? 0,
      meilleurPoidsAtteint
    );
  }
  return new ObjectifTemps(
    row.id,
    row.nom,
    row.disciplineId ?? "",
    row.deadline,
    row.heuresCible,
    row.minutesInvesties
  );
}
