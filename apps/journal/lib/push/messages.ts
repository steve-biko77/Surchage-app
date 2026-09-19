// Variantes de messages du nudge adaptatif -- jamais le meme deux fois de suite (voir pickVariant).

export const MESSAGES_JOURNEE_VIDE = [
  "Ta journée est encore une page blanche. On la remplit ?",
  "Aucune tâche prévue aujourd'hui — deux minutes suffisent pour poser un plan.",
  "Remplis ta journée : même 3 tâches, ça change tout.",
  "Rien au programme pour l'instant. Ouvre Journal et note ce qui compte aujourd'hui.",
];

export const MESSAGES_RAPPEL_STANDARD = [
  "Tes tâches attendent toujours. On coche la première ?",
  "Aucune case cochée pour l'instant — un petit pas suffit.",
  "Ta journée est posée, mais rien n'a bougé. C'est le moment.",
  "Une discipline, une tâche : choisis-en une et avance.",
];

export function pickVariant(pool: string[], dernierMessage: string | null): string {
  const options = pool.length > 1 && dernierMessage ? pool.filter((m) => m !== dernierMessage) : pool;
  return options[Math.floor(Math.random() * options.length)];
}
