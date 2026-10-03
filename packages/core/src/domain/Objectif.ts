export abstract class Objectif {
  constructor(
    public readonly id: string,
    public readonly nom: string,
    public readonly disciplineId: string,
    public readonly deadline: string | null,
  ) {}

  /** Chaque sous-type sait calculer sa propre progression. */
  abstract calculerProgression(): number; // 0-100

  /** Chaque sous-type sait décrire son unité pour l'affichage. */
  abstract describeUnite(): string;
}

export class ObjectifTemps extends Objectif {
  constructor(
    id: string, nom: string, disciplineId: string, deadline: string | null,
    private heuresCible: number,
    private minutesInvesties: number,
  ) { super(id, nom, disciplineId, deadline); }

  calculerProgression(): number {
    if (this.heuresCible <= 0) return 0;
    return Math.min(100, Math.round((this.minutesInvesties / 60 / this.heuresCible) * 100));
  }
  describeUnite(): string {
    return `${Math.round(this.minutesInvesties / 60 * 10) / 10} / ${this.heuresCible} h`;
  }
}

export class ObjectifPerformance extends Objectif {
  constructor(
    id: string, nom: string, disciplineId: string, deadline: string | null,
    private poidsCible: number,
    private meilleurPoidsAtteint: number,
  ) { super(id, nom, disciplineId, deadline); }

  calculerProgression(): number {
    if (this.poidsCible <= 0) return 0;
    return Math.min(100, Math.round((this.meilleurPoidsAtteint / this.poidsCible) * 100));
  }
  describeUnite(): string {
    return `${this.meilleurPoidsAtteint} / ${this.poidsCible} kg`;
  }
}

/** Objectif a metrique libre (Elo, pages lues, km, kg...) -- generalisation d'ObjectifPerformance. */
export class ObjectifMetrique extends Objectif {
  constructor(
    id: string, nom: string, disciplineId: string, deadline: string | null,
    private unite: string,
    private valeurDepart: number,
    private valeurCible: number,
    private valeurActuelle: number,
    private sens: "croissant" | "decroissant" = "croissant",
  ) { super(id, nom, disciplineId, deadline); }

  calculerProgression(): number {
    const [depart, cible, actuelle] = [this.valeurDepart, this.valeurCible, this.valeurActuelle];
    if (this.sens === "croissant") {
      if (cible === depart) return actuelle >= cible ? 100 : 0;
      return Math.max(0, Math.min(100, Math.round((actuelle - depart) / (cible - depart) * 100)));
    } else {
      if (depart === cible) return actuelle <= cible ? 100 : 0;
      return Math.max(0, Math.min(100, Math.round((depart - actuelle) / (depart - cible) * 100)));
    }
  }
  describeUnite(): string {
    return `${this.valeurActuelle} / ${this.valeurCible} ${this.unite}`;
  }
}
