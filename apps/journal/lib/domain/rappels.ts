// Rappels des taches a heure fixe.
//
// La route de relance passe toutes les cinq minutes et envoie CE QUI ETAIT DU
// DEPUIS SON DERNIER PASSAGE, au lieu d'attendre d'etre appelee pile a l'heure.
// C'est ce renversement qui rend l'ordonnanceur fiable sans etre ponctuel :
// GitHub Actions derive de plusieurs minutes et saute des executions, mais un
// passage en retard envoie quand meme, et un passage saute est rattrape par le
// suivant. L'irregularite devient une latence bornee, pas une perte.
//
// Rien ici ne touche la base ni le reseau : ce module prend des valeurs et rend
// des valeurs, pour etre testable sans infrastructure.

/** Minutes ecoulees depuis minuit pour une heure "HH:mm". */
function enMinutes(heure: string): number {
  const [hh, mm] = heure.split(":").map(Number);
  return hh * 60 + mm;
}

/**
 * Au-dela de ce delai, un rappel n'est plus envoye.
 *
 * Deux raisons. D'abord une panne de l'ordonnanceur ne doit pas produire une
 * rafale de rappels perimes au retablissement. Ensuite, passe deux heures, un
 * rappel n'aide plus a faire la chose : il constate qu'elle n'a pas ete faite,
 * et le produit ne reproche rien.
 */
export const PEREMPTION_MINUTES = 120;

/**
 * Au-dela de ce nombre de taches dues au meme passage, on envoie un seul
 * message groupe. Trois notifications d'affilee se lisent, huit se balaient
 * sans etre lues -- et une notification qu'on apprend a ignorer est pire que
 * pas de notification du tout.
 */
export const MAX_NOTIFICATIONS_INDIVIDUELLES = 3;

export type TacheProgrammee = {
  id: string;
  texte: string;
  /** "HH:mm". Les taches sans heure n'arrivent jamais ici. */
  heure: string | null;
};

export type TriDesRappels<T> = {
  /** A notifier maintenant, de la plus ancienne a la plus recente. */
  aEnvoyer: T[];
  /** Heure trop ancienne : a marquer traitees SANS notification. */
  perimees: T[];
};

/**
 * Repartit les candidates entre celles a notifier et celles qui ont trop
 * attendu. `maintenant` est l'heure locale en minutes depuis minuit : le
 * fuseau est resolu par l'appelant, ce module n'en connait aucun.
 *
 * Une tache dont l'heure n'est pas encore venue n'est dans aucune des deux
 * listes : elle sera reprise au passage suivant.
 */
export function trierRappels<T extends TacheProgrammee>(
  candidates: T[],
  maintenantEnMinutes: number,
  peremptionMinutes: number = PEREMPTION_MINUTES
): TriDesRappels<T> {
  const aEnvoyer: T[] = [];
  const perimees: T[] = [];

  for (const t of candidates) {
    if (!t.heure) continue;
    const retard = maintenantEnMinutes - enMinutes(t.heure);
    if (retard < 0) continue;
    if (retard > peremptionMinutes) perimees.push(t);
    else aEnvoyer.push(t);
  }

  aEnvoyer.sort((a, b) => enMinutes(a.heure!) - enMinutes(b.heure!));
  return { aEnvoyer, perimees };
}

export type Notification = { titre: string; corps: string };

/**
 * Compose les notifications a partir des taches dues.
 *
 * Le ton est factuel et ne ressemble pas aux messages d'encouragement : un
 * rappel dit l'heure et la chose, sans variante motivante. Les deux registres
 * ne doivent pas se confondre, sinon l'un decredibilise l'autre.
 */
export function composerNotifications(
  dues: TacheProgrammee[],
  maxIndividuelles: number = MAX_NOTIFICATIONS_INDIVIDUELLES
): Notification[] {
  if (dues.length === 0) return [];

  if (dues.length <= maxIndividuelles) {
    return dues.map((t) => ({ titre: t.heure!, corps: t.texte }));
  }

  return [
    {
      titre: `${dues.length} tâches à faire`,
      corps: dues.map((t) => `${t.heure} ${t.texte}`).join(" · "),
    },
  ];
}
