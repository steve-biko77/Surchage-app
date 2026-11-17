// Profil d'heures et mode de coche.
//
// Deux mesures tirées d'une seule donnée : l'instant où la personne a coché.
// À quelles heures elle agit, et si elle tient son journal au fil de la
// journée ou tout en bloc le soir.
//
// Rien n'est stocké, comme partout ailleurs : un profil figé deviendrait faux
// à la première correction rétroactive, et resterait faux pour toujours.
//
// Ce module ne qualifie rien. Il produit « en bloc », jamais « mauvais ».
// L'interprétation appartient à l'affichage, et le ton au socle.

import { todayISO, heureLocaleParis } from "./services";

/**
 * Au-delà de cette pause entre deux coches consécutives, on considère que la
 * personne est REVENUE dans l'application plutôt qu'avoir été interrompue au
 * milieu d'un même passage.
 *
 * Quatre-vingt-dix minutes : plus long qu'un repas ou un appel au milieu d'une
 * session, plus court que l'écart entre deux moments distincts d'une journée.
 * Valeur arbitrée explicitement, pas héritée d'un usage.
 */
export const PAUSE_ENTRE_SESSIONS_MINUTES = 90;

/**
 * En dessous de ce nombre de coches, la journée est `indetermine`.
 *
 * Avec deux coches il n'existe qu'un seul intervalle : conclure à un rythme à
 * partir d'un seul écart, c'est confondre un hasard avec un comportement. À
 * partir de trois, il y a une forme.
 */
export const MINIMUM_COCHES_POUR_CONCLURE = 3;

export type SourceDeCoche = "tache" | "discipline";

/** Une coche telle qu'elle sort du dépôt, l'instant pouvant manquer. */
export type CocheBrute = {
  /**
   * Journée que la coche DÉCRIT, "YYYY-MM-DD" -- la date de la tâche ou de la
   * validation, pas celle de l'instant. Les deux diffèrent quand la coche est
   * posée un autre jour que celui qu'elle concerne.
   */
  jour: string;
  /**
   * Instant de la coche, ou null pour les lignes antérieures à l'horodatage.
   * Null n'est pas une anomalie à combler : c'est « on ne savait pas encore
   * mesurer », et ça doit rester visible comme tel.
   */
  instant: Date | null;
  source: SourceDeCoche;
};

export type Coche = CocheBrute & { instant: Date };

/**
 * Une coche posée un autre jour que celui qu'elle décrit.
 *
 * Son heure ne dit rien des habitudes : elle date du moment où la personne
 * est revenue en arrière, pas du moment où elle a agi. Un profil d'heures qui
 * les compterait mélangerait deux gestes incomparables.
 *
 * La règle est générale et ne vise aucune ligne en particulier. Elle attrape
 * aussi bien un rattrapage humain qu'un import en masse -- et c'est ainsi
 * qu'elle a révélé, sur les données réelles, que vingt-six validations
 * portaient le même horodatage à la seconde près.
 *
 * À ne pas confondre avec la déclaration « à l'heure / rattrapée » d'une tâche,
 * qui porte sur un créneau RATÉ DANS LA JOURNÉE et que seule la personne peut
 * trancher. Ici il s'agit du jour, pas de l'heure.
 */
export function estHorsJour(coche: Coche): boolean {
  return todayISO(coche.instant) !== coche.jour;
}

export type Tri = {
  /** Horodatées et posées le jour qu'elles décrivent : exploitables. */
  exploitables: Coche[];
  /** Horodatées mais posées un autre jour : comptées, jamais agrégées. */
  horsJour: number;
  /** Sans horodatage, antérieures à la mesure. */
  sansHeure: number;
};

/**
 * Sépare ce qui peut servir à un profil d'heures de ce qui ne le peut pas.
 *
 * Les deux rejets sont comptés et remontés avec le résultat. Un profil calculé
 * sur une partie des données sans le dire est un profil mensonger -- et dans
 * ce journal, la part écartée a été jusqu'à un huitième du total.
 */
export function trierPourProfil(brutes: CocheBrute[]): Tri {
  const exploitables: Coche[] = [];
  let horsJour = 0;
  let sansHeure = 0;

  for (const c of brutes) {
    if (!c.instant) {
      sansHeure++;
      continue;
    }
    const coche = c as Coche;
    if (estHorsJour(coche)) horsJour++;
    else exploitables.push(coche);
  }

  return { exploitables, horsJour, sansHeure };
}

export type ProfilDHeures = {
  /** Vingt-quatre cases, l'index étant l'heure locale à Paris. */
  parHeure: number[];
  total: number;
  /** Heure la plus chargée, ou null s'il n'y a aucune coche. */
  heureDePointe: number | null;
};

/** Distribution par heure locale. Les coches reçues sont supposées triées. */
export function profilDHeures(coches: Coche[]): ProfilDHeures {
  const parHeure = Array<number>(24).fill(0);
  for (const c of coches) parHeure[heureLocaleParis(c.instant)]++;

  let heureDePointe: number | null = null;
  for (let h = 0; h < 24; h++) {
    if (parHeure[h] > 0 && (heureDePointe === null || parHeure[h] > parHeure[heureDePointe])) {
      heureDePointe = h;
    }
  }

  return { parHeure, total: coches.length, heureDePointe };
}

export type ProfilsParSource = {
  tache: ProfilDHeures;
  discipline: ProfilDHeures;
  horsJour: number;
  sansHeure: number;
};

/**
 * Profils d'heures, tâches et disciplines séparées.
 *
 * Séparées parce que ce ne sont pas les mêmes gestes : cocher une tâche est un
 * acte de la journée, valider une discipline est un bilan. Les additionner
 * produirait une courbe qui ne décrit personne.
 */
export function profilsParSource(brutes: CocheBrute[]): ProfilsParSource {
  const { exploitables, horsJour, sansHeure } = trierPourProfil(brutes);
  return {
    tache: profilDHeures(exploitables.filter((c) => c.source === "tache")),
    discipline: profilDHeures(exploitables.filter((c) => c.source === "discipline")),
    horsJour,
    sansHeure,
  };
}

export type ModeDeCoche = "au-fil-de-l-eau" | "en-bloc" | "indetermine";

export type RythmeDuJour = {
  jour: string;
  mode: ModeDeCoche;
  /** Passages distincts dans l'application. 0 quand il n'y a aucune coche. */
  sessions: number;
  coches: number;
};

/**
 * Découpe les coches d'une journée en sessions, et en déduit le mode.
 *
 * Le découpage se fait sur les INSTANTS ABSOLUS, jamais sur les minutes depuis
 * minuit. Une journée dont les dernières coches tombent après minuit --
 * cinq cas sur cent-quatre-vingts dans les données réelles -- verrait sinon
 * ses coches de 00h10 classées avant celles de 23h50, et la pause calculée à
 * l'envers.
 *
 * Pourquoi compter les sessions plutôt que mesurer l'étalement : une journée
 * avec deux coches à 9h et trois à 22h a treize heures d'étendue, ce qui
 * ressemble à « au fil de l'eau » alors que ce sont deux blocs. Le nombre de
 * sessions dit la bonne chose, et dit davantage qu'un booléen.
 */
export function rythmeDuJour(
  jour: string,
  coches: Coche[],
  pauseMinutes: number = PAUSE_ENTRE_SESSIONS_MINUTES,
  minimumCoches: number = MINIMUM_COCHES_POUR_CONCLURE
): RythmeDuJour {
  const instants = coches
    .map((c) => c.instant.getTime())
    .sort((a, b) => a - b);

  if (instants.length === 0) {
    return { jour, mode: "indetermine", sessions: 0, coches: 0 };
  }

  const pauseMs = pauseMinutes * 60 * 1000;
  let sessions = 1;
  for (let i = 1; i < instants.length; i++) {
    if (instants[i] - instants[i - 1] >= pauseMs) sessions++;
  }

  const mode: ModeDeCoche =
    instants.length < minimumCoches
      ? "indetermine"
      : sessions > 1
        ? "au-fil-de-l-eau"
        : "en-bloc";

  return { jour, mode, sessions, coches: instants.length };
}

export type Rythmes = {
  /** Une entrée par journée ayant au moins une coche exploitable, triée par date. */
  jours: RythmeDuJour[];
  horsJour: number;
  sansHeure: number;
};

/**
 * Rythme de chaque journée d'une fenêtre.
 *
 * Tâches et disciplines sont ici réunies, contrairement au profil d'heures :
 * le rythme est celui de la personne, pas celui d'un type d'objet. Une session
 * où elle coche une tâche puis valide une discipline est une seule session, et
 * la couper en deux inventerait un comportement qui n'a pas eu lieu.
 */
export function rythmeParJour(
  brutes: CocheBrute[],
  pauseMinutes: number = PAUSE_ENTRE_SESSIONS_MINUTES,
  minimumCoches: number = MINIMUM_COCHES_POUR_CONCLURE
): Rythmes {
  const { exploitables, horsJour, sansHeure } = trierPourProfil(brutes);

  const parJour = new Map<string, Coche[]>();
  for (const c of exploitables) {
    const liste = parJour.get(c.jour);
    if (liste) liste.push(c);
    else parJour.set(c.jour, [c]);
  }

  const jours = [...parJour.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([jour, coches]) => rythmeDuJour(jour, coches, pauseMinutes, minimumCoches));

  return { jours, horsJour, sansHeure };
}
