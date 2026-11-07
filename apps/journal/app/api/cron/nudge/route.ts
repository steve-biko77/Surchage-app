export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { autoriseAppelInterne } from "@/lib/nudge/auth";
import {
  tachesRepository,
  joursValidesRepository,
  nudgeStateRepository,
  pushSubscriptionsRepository,
  objectifsRepository,
  tracesRepository,
} from "@/lib/adapters/repositories";
import { envoyerPush } from "@/lib/nudge/push";
import { alerteObjectif, coherenceParObjectif, semaineDe } from "@/lib/domain/coherence";
import { todayISO, heureLocaleParis, minutesLocalesParis } from "@/lib/domain/services";
import { materialiserTachesRecurrentes } from "@/lib/domain/recurrence";
import { trierRappels, composerNotifications } from "@/lib/domain/rappels";
import { MESSAGES_JOURNEE_VIDE, MESSAGES_RAPPEL_STANDARD, pickVariant } from "@/lib/nudge/messages";

// Une fois l'engagement du jour amorce, on ne relance qu'apres 2h d'inactivite.
const REPRISE_APRES_MS = 2 * 60 * 60 * 1000;

/**
 * Point d'entree appele toutes les cinq minutes par .github/workflows/nudge.yml.
 *
 * Deux responsabilites nettement separees, et c'est volontaire :
 *
 *   1. LES RAPPELS DE TACHES, a l'heure que la personne a elle-meme fixee.
 *      Sans borne horaire : une tache posee a 4h a ete posee a 4h sciemment,
 *      l'application n'a pas a censurer ce choix. Chaque tache n'est notifiee
 *      qu'une fois, grace a la marque `rappel_envoye_a`.
 *
 *   2. LA RELANCE GENERIQUE, bornee a 6h-22h et plafonnee a UNE PAR JOUR.
 *      L'ancien garde-fou couvrait 50 minutes alors que l'ordonnanceur passait
 *      toutes les heures : chaque appel tombait hors de la fenetre, et une
 *      journee sans tache cochee produisait seize notifications.
 *
 * Les deux budgets sont independants : recevoir le rappel de sa tache de 9h
 * n'empeche pas la relance du soir, et inversement.
 */
export async function POST(req: Request) {
  if (!autoriseAppelInterne(req)) {
    return NextResponse.json({ error: "non autorise" }, { status: 401 });
  }

  const maintenant = new Date();
  const today = todayISO(maintenant);
  await materialiserTachesRecurrentes(today);

  const rappels = await envoyerRappelsDeTaches(today, maintenant);
  const relance = await envoyerRelanceGenerique(today, maintenant);

  return NextResponse.json({ rappels, relance });
}

/**
 * Journal d'un passage de rappels.
 *
 * Quatre nombres qui comptent quatre choses differentes, et aucun ne doit
 * pouvoir etre pris pour un autre :
 *
 *   dues        taches dont l'heure est passee et qui meritaient un rappel
 *   taches      celles effectivement marquees comme rappelees
 *   livraisons  envois push repartis -- UN PAR APPAREIL ABONNE
 *   perimees    taches classees sans notification, heure trop ancienne
 *
 * `dues` et `taches` ne divergent que dans un cas, et c'est precisement celui
 * qu'on veut voir : aucun appareil abonne. `livraisons` depasse `taches` des
 * qu'il y a plus d'un appareil, et peut aussi etre plus petit qu'elle quand
 * plusieurs taches sont regroupees en un seul message.
 *
 * Ce journal est le seul endroit d'ou l'on observe le mecanisme de l'exterieur.
 * Un rappel qui echoue ne se voit pas -- il se manifeste par du silence --
 * donc ces nombres sont le seul temoin disponible, et un temoin qui se lit de
 * travers mentira le jour ou l'on en aura besoin.
 */
type JournalDesRappels = {
  dues: number;
  taches: number;
  livraisons: number;
  perimees: number;
};

const RIEN_A_FAIRE: JournalDesRappels = { dues: 0, taches: 0, livraisons: 0, perimees: 0 };

/** Envoie les rappels des taches dont l'heure est passee, une seule fois chacune. */
async function envoyerRappelsDeTaches(
  today: string,
  maintenant: Date
): Promise<JournalDesRappels> {
  const candidates = await tachesRepository.candidatesAuRappel(today);
  if (candidates.length === 0) return RIEN_A_FAIRE;

  const { aEnvoyer, perimees } = trierRappels(candidates, minutesLocalesParis(maintenant));
  if (aEnvoyer.length === 0 && perimees.length === 0) return RIEN_A_FAIRE;

  const abonnements = await pushSubscriptionsRepository.all();
  let livraisons = 0;

  for (const notification of composerNotifications(aEnvoyer)) {
    const r = await envoyerPush(abonnements, { ...notification, url: "/jour" });
    livraisons += r.envoyes;
    for (const endpoint of r.perimes) await pushSubscriptionsRepository.supprimer(endpoint);
  }

  // Les perimees sont classees sans notification : leur heure est trop loin.
  const aMarquer = perimees.map((t) => t.id);

  // Les dues ne sont marquees QUE si un envoi a ete tente. Sans appareil
  // abonne, rien n'est parti : les marquer ferait disparaitre le rappel pour
  // toujours alors qu'il n'a jamais eu lieu.
  const rappelees = abonnements.length > 0 ? aEnvoyer : [];
  aMarquer.push(...rappelees.map((t) => t.id));

  await tachesRepository.marquerRappelsTraites(aMarquer);

  return {
    dues: aEnvoyer.length,
    taches: rappelees.length,
    livraisons,
    perimees: perimees.length,
  };
}

/** Relance d'encouragement : bornee a 6h-22h, au plus une par jour. */
async function envoyerRelanceGenerique(today: string, maintenant: Date) {
  const heure = heureLocaleParis(maintenant);
  if (heure < 6 || heure >= 22) {
    return { envoye: false, raison: "hors plage 6h-22h (Europe/Paris)" };
  }

  const etat = await nudgeStateRepository.getOuCreer();
  const dejaNotifieAujourdhui =
    !!etat.lastNotifiedAt && todayISO(new Date(etat.lastNotifiedAt)) === today;

  async function envoyer(message: string, horsBudgetQuotidien = false) {
    if (dejaNotifieAujourdhui && !horsBudgetQuotidien) {
      return { envoye: false, raison: "relance generique deja envoyee aujourd'hui" };
    }

    const abonnements = await pushSubscriptionsRepository.all();
    if (abonnements.length === 0) {
      return { envoye: false, raison: "aucun appareil abonne" };
    }

    const r = await envoyerPush(abonnements, { titre: "Journal", corps: message, url: "/jour" });
    for (const endpoint of r.perimes) await pushSubscriptionsRepository.supprimer(endpoint);
    if (r.envoyes === 0) return { envoye: false, raison: "aucun envoi abouti", message };

    await nudgeStateRepository.enregistrerNotification(message);
    return { envoye: true, message, destinataires: r.envoyes };
  }

  const taches = await tachesRepository.parDate(today);
  if (taches.length === 0) {
    return envoyer(pickVariant(MESSAGES_JOURNEE_VIDE, etat.lastMessage));
  }

  const uneTacheCochee = taches.some((t) => t.fait);
  const validationAujourdhui = await joursValidesRepository.uneValidationLe(today);

  // Les taches a heure fixe ont leur propre rappel, a l'heure dite. Les compter
  // ici reviendrait a notifier deux fois pour la meme chose : seules les taches
  // sans heure -- de simples elements de liste -- justifient une relance.
  const sansHeureRestantes = taches.filter((t) => !t.heure && !t.fait && !t.ignoree);

  if (!uneTacheCochee && !validationAujourdhui && sansHeureRestantes.length > 0) {
    return envoyer(pickVariant(MESSAGES_RAPPEL_STANDARD, etat.lastMessage));
  }

  const inactifDepuis2h =
    !!etat.lastActionAt &&
    maintenant.getTime() - new Date(etat.lastActionAt).getTime() >= REPRISE_APRES_MS;

  if (inactifDepuis2h && sansHeureRestantes.length > 0) {
    return envoyer(pickVariant(MESSAGES_RAPPEL_STANDARD, etat.lastMessage));
  }

  // Rappel hebdomadaire : un objectif qui n'a pas bouge de la semaine.
  //
  // Il ne passe qu'a 18h, et echappe au budget quotidien : il parle de la
  // semaine et non de la journee, et sa frequence naturelle est deja d'au plus
  // une fois par jour. Une seule heure, parce qu'un rappel repete trois
  // apres-midi d'affilee est un rappel qu'on apprend a ignorer.
  if (heure === 18 && minutesLocalesParis(maintenant) % 60 < 5) {
    const message = await rappelObjectifNeglige(today);
    if (message) return envoyer(message, true);
  }

  return { envoye: false, raison: "engagement deja amorce aujourd'hui" };
}

/**
 * Message pour les objectifs restes a l'arret cette semaine, ou null s'il n'y
 * a rien a signaler. Les objectifs sans rythme vise sont ignores : sans
 * denominateur, "neglige" ne veut rien dire.
 */
async function rappelObjectifNeglige(today: string): Promise<string | null> {
  const semaine = semaineDe(today);
  const [rows, traces] = await Promise.all([
    objectifsRepository.all(),
    tracesRepository.entreDates(semaine[0], semaine[6]),
  ]);

  const coherences = coherenceParObjectif(
    rows.map((r) => ({ id: r.id, joursParSemaine: r.joursParSemaine })),
    traces,
    semaine
  );

  const negliges = rows.filter((r) => alerteObjectif(coherences.get(r.id)!, today) === "neglige");
  if (negliges.length === 0) return null;
  if (negliges.length === 1) return `« ${negliges[0].nom} » n'a pas bougé de la semaine.`;
  return `${negliges.length} objectifs n'ont pas bougé de la semaine.`;
}
