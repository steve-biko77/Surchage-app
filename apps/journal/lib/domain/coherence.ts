// Cohérence hebdomadaire par objectif.
//
// « Cohérence semaine : 81% » demandait un dénominateur que le schéma n'avait
// pas. Il existe maintenant : `objectifs.joursParSemaine`, le rythme visé.
// La cohérence est le rapport entre les jours où l'objectif a réellement
// avancé cette semaine et ce rythme.
//
// Rien n'est stocké. Tout se recalcule à la lecture, à partir des tâches et
// des validations de discipline. C'est la règle qui tient toute la
// gamification : si on figeait un score, la moindre correction rétroactive
// d'une journée passée le laisserait faux pour toujours.

import { debutSemaine, decalerDate } from "./services";

/** Une trace datée d'avancement sur un objectif. */
export type Trace = { objectifId: string; date: string };

export type CoherenceObjectif = {
  objectifId: string;
  /** Jours distincts où l'objectif a avancé dans la fenêtre. */
  joursFaits: number;
  /** Rythme visé, ou null si l'objectif n'en déclare pas. */
  joursVises: number | null;
  /** 0..100, ou null sans rythme visé. Plafonné : faire plus que prévu ne fait pas 140%. */
  pourcentage: number | null;
  /** Dates effectivement travaillées, pour l'affichage en pastilles. */
  dates: string[];
};

/** Les sept dates de la semaine ISO contenant `date`. */
export function semaineDe(date: string): string[] {
  const lundi = debutSemaine(date);
  return Array.from({ length: 7 }, (_, i) => decalerDate(lundi, i));
}

/**
 * Cohérence de chaque objectif sur une fenêtre de dates.
 *
 * Un même jour ne compte qu'une fois, quel que soit le nombre de tâches
 * cochées : l'objectif mesure une régularité, pas un volume. Trois tâches le
 * lundi et rien du reste de la semaine, c'est un jour sur sept.
 */
export function coherenceParObjectif(
  objectifs: Array<{ id: string; joursParSemaine: number | null }>,
  traces: Trace[],
  fenetre: string[]
): Map<string, CoherenceObjectif> {
  const dans = new Set(fenetre);
  const parObjectif = new Map<string, Set<string>>();
  for (const t of traces) {
    if (!dans.has(t.date)) continue;
    const s = parObjectif.get(t.objectifId) ?? new Set<string>();
    s.add(t.date);
    parObjectif.set(t.objectifId, s);
  }

  const out = new Map<string, CoherenceObjectif>();
  for (const o of objectifs) {
    const dates = [...(parObjectif.get(o.id) ?? [])].sort();
    const vises = o.joursParSemaine && o.joursParSemaine > 0 ? o.joursParSemaine : null;
    out.set(o.id, {
      objectifId: o.id,
      joursFaits: dates.length,
      joursVises: vises,
      pourcentage: vises == null ? null : Math.min(100, Math.round((dates.length / vises) * 100)),
      dates,
    });
  }
  return out;
}

/**
 * État d'alerte d'un objectif dans sa semaine.
 *
 *   "neglige"    la semaine est bien entamée et l'objectif n'a pas bougé
 *                une seule fois. C'est le rappel demandé : « tu n'as pas
 *                travaillé cet objectif de la semaine ».
 *   "hors-rythme" il reste moins de jours qu'il n'en manque : le rythme
 *                ne peut plus être tenu, même en travaillant tous les jours.
 *
 * Deux états plutôt qu'un seul, parce qu'ils n'appellent pas la même chose :
 * le premier dit « commence », le second dit « c'est raté pour cette
 * semaine, ne t'acharne pas ».
 *
 * Le seuil de "neglige" est le jeudi (quatre jours restants ou moins).
 * Prévenir un lundi soir qu'un objectif hebdomadaire n'a pas avancé serait
 * du bruit, et du bruit c'est une alerte qu'on apprend à ignorer.
 */
export type Alerte = "neglige" | "hors-rythme" | null;

export function alerteObjectif(c: CoherenceObjectif, aujourdhui: string): Alerte {
  if (c.joursVises == null) return null;
  const restants = semaineDe(aujourdhui).filter((d) => d >= aujourdhui).length;
  const manquants = c.joursVises - c.joursFaits;
  if (manquants <= 0) return null;
  if (manquants > restants) return "hors-rythme";
  if (c.joursFaits === 0 && restants <= 4) return "neglige";
  return null;
}

/**
 * Indice de productivité de la semaine, 0..100.
 *
 * Moyenne des cohérences des objectifs qui déclarent un rythme. Les autres
 * sont ignorés plutôt que comptés à zéro : ne pas avoir fixé de rythme n'est
 * pas un échec, et les faire peser à zéro rendrait l'indice mensonger.
 * Retourne null quand aucun objectif n'a de rythme — il n'y a alors rien à
 * mesurer, et un cercle à 0% le ferait croire à un échec.
 */
export function indiceProductivite(coherences: Iterable<CoherenceObjectif>): number | null {
  let somme = 0;
  let n = 0;
  for (const c of coherences) {
    if (c.pourcentage == null) continue;
    somme += c.pourcentage;
    n += 1;
  }
  return n === 0 ? null : Math.round(somme / n);
}

export type Palier = "faible" | "moyen" | "bon" | "excellent";

/** Palier de l'indice : porte la couleur rouge -> jaune -> vert. */
export function palierIndice(indice: number): Palier {
  if (indice < 40) return "faible";
  if (indice < 70) return "moyen";
  if (indice < 85) return "bon";
  return "excellent";
}
