// Coeur de domaine - services metier purs (chapitre V, 5.5)
// Aucune de ces fonctions ne touche la base de donnees ni le DOM : elles prennent
// des donnees deja chargees et retournent un resultat calcule.

import type { Serie, CibleAuto, JourSemaine, GroupeMusculaire } from "./types";

const JOURS: JourSemaine[] = [
  "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
];

const FUSEAU = "Europe/Paris";

/**
 * ClockPort minimal - date du jour au format ISO (YYYY-MM-DD), toujours resolue
 * en heure locale France quel que soit le fuseau du runtime (serveur Vercel = UTC,
 * navigateur = fuseau du device). Deterministe : ne depend jamais du fuseau ambiant.
 */
export function todayISO(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSEAU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** ClockPort minimal - jour de la semaine actuel en francais, en heure locale France */
export function jourDeLaSemaine(date: Date = new Date()): JourSemaine {
  const [y, m, d] = todayISO(date).split("-").map(Number);
  const utcMidnight = new Date(Date.UTC(y, m - 1, d));
  return JOURS[utcMidnight.getUTCDay()];
}

/** Increment de charge par defaut selon le type de materiel utilise pour l'exercice */
export const INCREMENT_PAR_TYPE: Record<string, number> = {
  haltere: 2,
  poulie: 5,
  barre: 5,
  poids_du_corps: 0,
};

/**
 * calculerCibleAuto - chapitre V, 5.5
 * Double progression : on gagne des reps a charge fixe jusqu'a repPlafond,
 * puis on monte le poids (selon typeCharge) et on redescend a repPlancher.
 * En cas d'echec (note "echec" ou reps < repPlancher), on stabilise la charge actuelle.
 * Pour les exercices au poids du corps, le plafond de reps declenche l'ajout d'une
 * serie plutot qu'une augmentation de charge (il n'y a pas de charge a augmenter).
 *
 * Pour les exercices a duree (uniteMesure = "duree"), meme logique de double
 * progression mais sur la duree tenue plutot que sur les repetitions. Si l'exercice
 * n'a pas de plancher/plafond definis (footing, jeu libre...), aucune cible auto
 * n'est proposee : on ne force pas une logique de progression la ou elle n'a pas
 * de sens (juste un journal de duree).
 */
export function calculerCibleAuto(
  dernieresSeries: Serie[],
  exercice: {
    typeCharge: string;
    repPlancher: number;
    repPlafond: number;
    uniteMesure?: string;
    dureePlancherSec?: number | null;
    dureePlafondSec?: number | null;
  }
): CibleAuto | null {
  if (dernieresSeries.length === 0) return null;

  if (exercice.uniteMesure === "duree") {
    return calculerCibleAutoDuree(dernieresSeries, exercice);
  }

  const sorted = [...dernieresSeries].sort((a, b) => a.date.localeCompare(b.date));
  const derniere = sorted[sorted.length - 1];
  const auPoidsDuCorps = exercice.typeCharge === "poids_du_corps";
  const increment = INCREMENT_PAR_TYPE[exercice.typeCharge] ?? 2;

  const echec =
    derniere.note?.toLowerCase().includes("échec") ||
    derniere.note?.toLowerCase().includes("echec") ||
    derniere.reps < exercice.repPlancher;

  if (echec) {
    return {
      mode: "reps",
      poidsCible: derniere.poids,
      repsCible: exercice.repPlancher,
      justification: "Stabilise a la charge actuelle avant de reprogresser.",
    };
  }

  if (derniere.reps < exercice.repPlafond) {
    return {
      mode: "reps",
      poidsCible: derniere.poids,
      repsCible: derniere.reps + 1,
      justification: `Meme charge, +1 repetition (double progression, plafond ${exercice.repPlafond}).`,
    };
  }

  // Plafond de reps atteint
  if (auPoidsDuCorps) {
    return {
      mode: "reps",
      poidsCible: 0,
      repsCible: exercice.repPlancher,
      justification: "Plafond de reps atteint -> ajoute une serie plutot qu'un poids (exercice au poids du corps).",
    };
  }
  return {
    mode: "reps",
    poidsCible: Math.round((derniere.poids + increment) * 2) / 2,
    repsCible: exercice.repPlancher,
    justification: `Plafond atteint -> +${increment}kg, reps repartent a ${exercice.repPlancher}.`,
  };
}

const INCREMENT_DUREE_SEC = 5;

function calculerCibleAutoDuree(
  dernieresSeries: Serie[],
  exercice: { dureePlancherSec?: number | null; dureePlafondSec?: number | null }
): CibleAuto | null {
  const { dureePlancherSec, dureePlafondSec } = exercice;
  if (dureePlancherSec == null || dureePlafondSec == null) return null;

  const avecDuree = dernieresSeries.filter((s) => s.dureeSecondes != null);
  if (avecDuree.length === 0) return null;

  const sorted = [...avecDuree].sort((a, b) => a.date.localeCompare(b.date));
  const derniere = sorted[sorted.length - 1];
  const dureeDerniere = derniere.dureeSecondes as number;

  const echec =
    derniere.note?.toLowerCase().includes("échec") ||
    derniere.note?.toLowerCase().includes("echec") ||
    dureeDerniere < dureePlancherSec;

  if (echec) {
    return {
      mode: "duree",
      dureeCibleSec: dureePlancherSec,
      justification: "Stabilise a cette duree avant de reprogresser.",
    };
  }

  if (dureeDerniere < dureePlafondSec) {
    return {
      mode: "duree",
      dureeCibleSec: Math.min(dureePlafondSec, dureeDerniere + INCREMENT_DUREE_SEC),
      justification: `Meme serie, +${INCREMENT_DUREE_SEC}s (double progression, plafond ${dureePlafondSec}s).`,
    };
  }

  return {
    mode: "duree",
    dureeCibleSec: dureePlancherSec,
    justification: `Plafond de ${dureePlafondSec}s atteint -> ajoute une serie, la duree repart a ${dureePlancherSec}s.`,
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

/**
 * calculerProgressionObjectifPerformance - % d'atteinte d'un objectif "performance".
 * seriesExercice peut regrouper les series de PLUSIEURS exercices lies a l'objectif
 * (relation plusieurs-a-plusieurs) : on retient le meilleur poids atteint tous confondus.
 */
export function calculerProgressionObjectifPerformance(
  seriesExercice: Serie[],
  poidsCible: number
): number {
  const meilleurPoids = seriesExercice.reduce((max, s) => Math.max(max, s.poids), 0);
  if (poidsCible <= 0) return 0;
  return Math.min(100, Math.round((meilleurPoids / poidsCible) * 100));
}

/** Zone corporelle regroupant les groupes musculaires - pour le libelle de dominante */
const ZONE_PAR_GROUPE: Record<GroupeMusculaire, string> = {
  dos: "haut du corps",
  pectoraux: "haut du corps",
  epaules: "haut du corps",
  biceps: "bras",
  triceps: "bras",
  "avant-bras": "bras",
  jambes: "jambes",
  mollets: "jambes",
  abdominaux: "core",
};

function capitaliser(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface ResumeSeance {
  nbExercicesDistincts: number;
  nbSeries: number;
  nbReps: number;
  tempsEstimeMin: number;
  dominante: string | null;
}

/**
 * calculerResumeSeance - cumul de la seance du jour (reelle) + libelle de dominante.
 * Le libelle combine la zone majoritaire et, si un groupe musculaire precis depasse
 * 40% du volume total (en series), sa propre dominante au sein de sa zone.
 */
export function calculerResumeSeance(
  seriesAujourdhui: Array<{ exerciceId: string; sets: number; reps: number }>,
  groupeParExercice: Record<string, string>
): ResumeSeance {
  const nbExercicesDistincts = new Set(seriesAujourdhui.map((s) => s.exerciceId)).size;
  const nbSeries = seriesAujourdhui.reduce((sum, s) => sum + s.sets, 0);
  const nbReps = seriesAujourdhui.reduce((sum, s) => sum + s.sets * s.reps, 0);
  const tempsEstimeMin = Math.round(nbSeries * 1.5);

  if (nbSeries === 0) {
    return { nbExercicesDistincts, nbSeries, nbReps, tempsEstimeMin, dominante: null };
  }

  const setsParGroupe: Record<string, number> = {};
  for (const s of seriesAujourdhui) {
    const groupe = groupeParExercice[s.exerciceId];
    if (!groupe) continue;
    setsParGroupe[groupe] = (setsParGroupe[groupe] ?? 0) + s.sets;
  }

  const setsParZone: Record<string, number> = {};
  for (const [groupe, sets] of Object.entries(setsParGroupe)) {
    const zone = ZONE_PAR_GROUPE[groupe as GroupeMusculaire];
    setsParZone[zone] = (setsParZone[zone] ?? 0) + (sets ?? 0);
  }
  const [zoneMajoritaire] = Object.entries(setsParZone).sort((a, b) => b[1] - a[1])[0];

  const groupesDeLaZone = Object.entries(setsParGroupe).filter(
    ([groupe]) => ZONE_PAR_GROUPE[groupe as GroupeMusculaire] === zoneMajoritaire
  );
  const [groupeDominant, setsDominant] = groupesDeLaZone.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0] ?? [null, 0];

  const sousDominante = groupeDominant && (setsDominant ?? 0) / nbSeries > 0.4 ? groupeDominant : null;
  const dominante = sousDominante
    ? `${capitaliser(zoneMajoritaire)} - dominante ${sousDominante}`
    : capitaliser(zoneMajoritaire);

  return { nbExercicesDistincts, nbSeries, nbReps, tempsEstimeMin, dominante };
}
