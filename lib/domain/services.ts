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

/**
 * calculerCibleAuto - chapitre V, 5.5
 * Regle : si la derniere serie a atteint ses reps visees, on propose +2.5kg
 * (ou +1 rep si poids du corps). Sinon on maintient la charge.
 */
export function calculerCibleAuto(dernieresSeries: Serie[]): CibleAuto | null {
  if (dernieresSeries.length === 0) return null;
  const sorted = [...dernieresSeries].sort((a, b) => a.date.localeCompare(b.date));
  const derniere = sorted[sorted.length - 1];

  const auPoidsDuCorps = derniere.poids === 0;
  const echec = derniere.note?.toLowerCase().includes("échec") || derniere.note?.toLowerCase().includes("echec");

  if (auPoidsDuCorps) {
    return echec
      ? { poidsCible: 0, repsCible: derniere.reps, justification: "Reproduis la meme performance (derniere serie difficile)." }
      : { poidsCible: 0, repsCible: derniere.reps + 1, justification: "Vise +1 repetition par rapport a la derniere fois." };
  }

  return echec
    ? { poidsCible: derniere.poids, repsCible: derniere.reps, justification: "Meme charge, stabilise avant de progresser." }
    : { poidsCible: Math.round((derniere.poids + 2.5) * 2) / 2, repsCible: derniere.reps, justification: "+2.5kg par rapport a la derniere seance." };
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
