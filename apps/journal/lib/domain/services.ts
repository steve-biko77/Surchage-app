const FUSEAU = "Europe/Paris";

/** Date du jour au format ISO (YYYY-MM-DD), toujours resolue en heure locale France. */
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

/** Decale une date ISO (YYYY-MM-DD) d'un nombre de jours (peut etre negatif). */
export function decalerDate(dateISO: string, jours: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

/**
 * Nombre de jours consecutifs valides jusqu'a `depuisDate` inclus (ou la veille
 * si `depuisDate` n'est pas valide). Meme algorithme que Discipline.calculerStreak
 * (package core) -- duplique ici uniquement pour l'affichage du nombre brut,
 * le niveau de flamme reste calcule par l'instance de domaine (polymorphisme).
 */
export function calculerStreak(historique: string[], depuisDate: string): number {
  const set = new Set(historique);
  let streak = 0;
  let cursor = depuisDate;
  if (!set.has(cursor)) cursor = decalerDate(cursor, -1);
  while (set.has(cursor)) {
    streak++;
    cursor = decalerDate(cursor, -1);
  }
  return streak;
}

/** Lundi de la semaine ISO contenant la date donnee. */
export function debutSemaine(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const jour = date.getUTCDay(); // 0 = dimanche
  const diff = jour === 0 ? -6 : 1 - jour;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}
