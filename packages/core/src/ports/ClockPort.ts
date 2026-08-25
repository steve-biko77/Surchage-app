/** Contrat d'horloge injectable — permet de substituer le temps réel en tests. */
export interface ClockPort {
  now(): Date;
  /** Date du jour au format ISO (YYYY-MM-DD), résolue dans le fuseau de l'implémentation. */
  todayISO(): string;
}
