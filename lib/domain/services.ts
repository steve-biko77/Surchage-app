// Coeur de domaine - services metier purs (chapitre V, 5.5)
// Aucune de ces fonctions ne touche la base de donnees ni le DOM : elles prennent
// des donnees deja chargees et retournent un resultat calcule.

import type { Serie, CibleAuto, JourSemaine } from "./types";

const JOURS: JourSemaine[] = [
  "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
];

/** ClockPort minimal - jour de la semaine actuel en francais */
export function jourDeLaSemaine(date: Date = new Date()): JourSemaine {
  return JOURS[date.getDay()];
}

export function todayISO(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** incrementParDefaut - les exercices a la poulie/machine cablee progressent par pas de 5kg */
export function incrementParDefaut(nomExercice: string): number {
  return nomExercice.toLowerCase().includes("poulie") ? 5 : 2;
}

/**
 * calculerCibleAuto - chapitre V, 5.5
 * Double progression : on gagne des reps a charge fixe jusqu'a repPlafond,
 * puis on monte le poids de incrementKg et on redescend a repPlancher.
 * En cas d'echec (note "echec" ou reps < repPlancher), on stabilise la charge actuelle.
 */
export function calculerCibleAuto(
  dernieresSeries: Serie[],
  exercice: { incrementKg: number; repPlancher: number; repPlafond: number }
): CibleAuto | null {
  if (dernieresSeries.length === 0) return null;
  const sorted = [...dernieresSeries].sort((a, b) => a.date.localeCompare(b.date));
  const derniere = sorted[sorted.length - 1];
  const echec =
    derniere.note?.toLowerCase().includes("échec") ||
    derniere.note?.toLowerCase().includes("echec") ||
    derniere.reps < exercice.repPlancher;

  if (echec) {
    return {
      poidsCible: derniere.poids,
      repsCible: exercice.repPlancher,
      justification: "Stabilise a la charge actuelle avant de reprogresser.",
    };
  }
  if (derniere.reps < exercice.repPlafond) {
    return {
      poidsCible: derniere.poids,
      repsCible: derniere.reps + 1,
      justification: `Meme charge, +1 repetition (double progression, plafond ${exercice.repPlafond}).`,
    };
  }
  return {
    poidsCible: Math.round((derniere.poids + exercice.incrementKg) * 2) / 2,
    repsCible: exercice.repPlancher,
    justification: `Plafond de ${exercice.repPlafond} reps atteint -> +${exercice.incrementKg}kg, reps repartent a ${exercice.repPlancher}.`,
  };
}

/** calculerNiveauFlamme - chapitre IV, Figure 4 (diagramme d'etat) */
export function calculerNiveauFlamme(totalSetsJour: number): 0 | 1 | 2 | 3 {
  if (totalSetsJour <= 0) return 0;
  if (totalSetsJour <= 5) return 1;
  if (totalSetsJour <= 12) return 2;
  return 3;
}

export function epley1RM(poids: number, reps: number): number | null {
  if (!poids || poids <= 0) return null;
  return Math.round(poids * (1 + reps / 30) * 10) / 10;
}

export function calculerProgression(seriesExercice: Serie[]) {
  const sorted = [...seriesExercice].sort((a, b) => a.date.localeCompare(b.date));
  const courbe = sorted.map((s) => ({
    date: s.date,
    poids: s.poids,
    reps: s.reps,
    sets: s.sets,
    unRM: epley1RM(s.poids, s.reps),
  }));
  const best = courbe.reduce<number | null>((acc, p) => (p.unRM && (!acc || p.unRM > acc) ? p.unRM : acc), null);
  const delta = sorted.length >= 2 ? sorted[sorted.length - 1].poids - sorted[0].poids : 0;
  return { courbe, unRMMax: best, delta, nbSeances: sorted.length };
}

/** calculerCoherence - vision globale, formule identique au module Sport */
export function calculerCoherence(joursActifs: number, joursPrevus: number): number {
  if (joursPrevus <= 0) return 0;
  return Math.round((joursActifs / joursPrevus) * 100);
}

/** calculerProgressionObjectifPerformance - % d'atteinte d'un objectif "performance", depuis l'historique reel */
export function calculerProgressionObjectifPerformance(
  seriesExercice: Serie[],
  poidsCible: number
): number {
  const meilleurPoids = seriesExercice.reduce((max, s) => Math.max(max, s.poids), 0);
  if (poidsCible <= 0) return 0;
  return Math.min(100, Math.round((meilleurPoids / poidsCible) * 100));
}
