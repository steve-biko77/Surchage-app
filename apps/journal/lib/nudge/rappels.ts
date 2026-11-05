import { journalCalendarRepository } from "@/lib/adapters/repositories";
import { poserRappelTache, supprimerRappelTache } from "@/lib/google/calendar";

/**
 * Pose et retire les rappels calendaires des taches, sans jamais echouer.
 *
 * Un rappel est un confort, pas une donnee. S'il ne part pas -- Google non
 * connecte, quota depasse, panne reseau -- la tache doit malgre tout etre
 * creee, cochee ou supprimee. Toutes les fonctions de ce module avalent donc
 * leurs erreurs, et c'est volontaire : l'appelant n'a aucune decision a
 * prendre, et aucune route ne doit renvoyer une erreur parce qu'un calendrier
 * tiers etait indisponible.
 *
 * La contrepartie est assumee : un rappel peut manquer sans que rien ne le
 * signale. C'est preferable a une tache qu'on ne peut pas cocher.
 */

type TachePlanifiable = {
  id: string;
  texte: string;
  date: string;
  heure: string | null;
};

/** Pose le rappel d'une tache. Sans heure, il n'y a rien a rappeler. */
export async function planifierRappel(tache: TachePlanifiable): Promise<void> {
  if (!tache.heure) return;
  try {
    const calendrier = await journalCalendarRepository.get();
    if (!calendrier) return;
    await poserRappelTache(calendrier.googleCalendarId, {
      id: tache.id,
      texte: tache.texte,
      date: tache.date,
      heure: tache.heure,
    });
  } catch {
    // Volontairement silencieux : voir l'en-tete du module.
  }
}

/**
 * Retire le rappel d'une tache. Appele sans savoir si un rappel existait --
 * notamment pour une tache sans heure, ou creee avant cette fonctionnalite.
 */
export async function retirerRappel(tacheId: string): Promise<void> {
  try {
    const calendrier = await journalCalendarRepository.get();
    if (!calendrier) return;
    await supprimerRappelTache(calendrier.googleCalendarId, tacheId);
  } catch {
    // Volontairement silencieux : voir l'en-tete du module.
  }
}
