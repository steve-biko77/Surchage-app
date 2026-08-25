export abstract class Discipline {
  constructor(
    public readonly id: string,
    public readonly nom: string,
    public readonly couleur: string,
    public readonly icone: string,
  ) {}

  /** Vrai si la discipline a été "faite" à cette date — définition propre à chaque discipline. */
  abstract estValidee(date: string, contexte: unknown): boolean;

  /** Niveau de flamme du jour — la logique de seuils peut différer par discipline. */
  calculerNiveauFlamme(historique: string[], date: string): 0 | 1 | 2 | 3 {
    // Implémentation par défaut : streak simple. Redéfinissable si besoin (voir SportDiscipline).
    const streak = this.calculerStreak(historique, date);
    if (streak <= 0) return 0;
    if (streak <= 2) return 1;
    if (streak <= 6) return 2;
    return 3;
  }

  protected calculerStreak(historique: string[], depuisDate: string): number {
    const set = new Set(historique);
    let streak = 0;
    let cursor = new Date(depuisDate);
    if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (set.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }
}

export class DisciplineCheckIn extends Discipline {
  // Duolingo, Trading, "pas de porno" — validée par un simple oui/non journalier
  estValidee(date: string, joursValides: string[]): boolean {
    return joursValides.includes(date);
  }
}

export class DisciplineSport extends Discipline {
  // Sport — validée par un volume minimal de séries, pas un simple oui/non
  estValidee(date: string, seriesDuJour: { sets: number }[]): boolean {
    const totalSets = seriesDuJour.reduce((s, x) => s + x.sets, 0);
    return totalSets > 0;
  }

  // Redéfinit la flamme : seuils par volume plutôt que par streak simple (logique déjà existante en Sport)
  calculerNiveauFlamme(_historique: string[], _date: string, totalSetsJour?: number): 0 | 1 | 2 | 3 {
    const total = totalSetsJour ?? 0;
    if (total <= 0) return 0;
    if (total <= 5) return 1;
    if (total <= 12) return 2;
    return 3;
  }
}
