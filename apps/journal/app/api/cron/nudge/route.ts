export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { autoriseAppelInterne } from "@/lib/nudge/auth";
import { tachesRepository, joursValidesRepository, nudgeStateRepository, journalCalendarRepository, pushSubscriptionsRepository, objectifsRepository, tracesRepository } from "@/lib/adapters/repositories";
import { envoyerPush } from "@/lib/nudge/push";
import { alerteObjectif, coherenceParObjectif, semaineDe } from "@/lib/domain/coherence";
import { todayISO, heureLocaleParis } from "@/lib/domain/services";
import { materialiserTachesRecurrentes } from "@/lib/domain/recurrence";
import { creerEvenementRappel } from "@/lib/google/calendar";
import { MESSAGES_JOURNEE_VIDE, MESSAGES_RAPPEL_STANDARD, pickVariant } from "@/lib/nudge/messages";

// Evite un doublon si l'appel externe (GitHub Actions) est redondant dans l'heure.
const DEDOUBLONNAGE_MS = 50 * 60 * 1000;
// Une fois l'engagement du jour amorce, on ne relance qu'apres 2h d'inactivite.
const REPRISE_APRES_MS = 2 * 60 * 60 * 1000;

/**
 * Point d'entree appele toutes les heures par .github/workflows/nudge.yml
 * (contourne la limite de cron de Vercel). Decide seul s'il faut notifier :
 * voir la logique adaptative dans le corps de la fonction.
 */
export async function POST(req: Request) {
  if (!autoriseAppelInterne(req)) {
    return NextResponse.json({ error: "non autorise" }, { status: 401 });
  }

  const maintenant = new Date();
  const heure = heureLocaleParis(maintenant);
  if (heure < 6 || heure >= 22) {
    return NextResponse.json({ envoye: false, raison: "hors plage 6h-22h (Europe/Paris)" });
  }

  const today = todayISO();
  await materialiserTachesRecurrentes(today);
  const etat = await nudgeStateRepository.getOuCreer();

  const dejaNotifieRecemment =
    !!etat.lastNotifiedAt && maintenant.getTime() - new Date(etat.lastNotifiedAt).getTime() < DEDOUBLONNAGE_MS;

  async function envoyer(message: string) {
    if (dejaNotifieRecemment) {
      return NextResponse.json({ envoye: false, raison: "deja notifie recemment (anti-doublon)" });
    }

    const canaux = { push: 0, perimes: 0, calendrier: false };

    // Canal principal : notification sur les appareils abonnes.
    const abonnements = await pushSubscriptionsRepository.all();
    if (abonnements.length > 0) {
      const r = await envoyerPush(abonnements, { titre: "Journal", corps: message, url: "/jour" });
      canaux.push = r.envoyes;
      canaux.perimes = r.perimes.length;
      // Un abonnement revoque par le navigateur n'a plus aucune valeur.
      for (const endpoint of r.perimes) await pushSubscriptionsRepository.supprimer(endpoint);
    }

    // Canal secondaire. Son absence renvoyait un 409, qui faisait echouer le
    // workflow GitHub a chaque passage en journee : ce n'est plus une erreur.
    try {
      const calendrier = await journalCalendarRepository.get();
      if (calendrier) {
        await creerEvenementRappel(calendrier.googleCalendarId, message);
        canaux.calendrier = true;
      }
    } catch {
      // Un calendrier en panne ne doit pas annuler un push deja parti.
    }

    if (canaux.push === 0 && !canaux.calendrier) {
      return NextResponse.json({
        envoye: false,
        raison: "aucun canal disponible : aucun appareil abonne et pas de calendrier connecte",
        canaux,
      });
    }

    await nudgeStateRepository.enregistrerNotification(message);
    return NextResponse.json({ envoye: true, message, canaux });
  }

  const taches = await tachesRepository.parDate(today);
  if (taches.length === 0) {
    return envoyer(pickVariant(MESSAGES_JOURNEE_VIDE, etat.lastMessage));
  }

  const uneTacheCochee = taches.some((t) => t.fait);
  const validationAujourdhui = await joursValidesRepository.uneValidationLe(today);

  if (!uneTacheCochee && !validationAujourdhui) {
    return envoyer(pickVariant(MESSAGES_RAPPEL_STANDARD, etat.lastMessage));
  }

  const inactifDepuis2h =
    !!etat.lastActionAt && maintenant.getTime() - new Date(etat.lastActionAt).getTime() >= REPRISE_APRES_MS;

  if (inactifDepuis2h) {
    return envoyer(pickVariant(MESSAGES_RAPPEL_STANDARD, etat.lastMessage));
  }

  // Rappel hebdomadaire : un objectif qui n'a pas bouge de la semaine.
  //
  // Il ne passe qu'une fois, a 18h, et seulement quand la journee est deja
  // engagee -- sinon il viendrait s'empiler sur le rappel du jour. Une seule
  // heure, parce que l'anti-doublon ne couvre que 50 minutes et qu'un rappel
  // repete trois apres-midi d'affilee est un rappel qu'on apprend a ignorer.
  if (heure === 18) {
    const message = await rappelObjectifNeglige(today);
    if (message) return envoyer(message);
  }

  return NextResponse.json({ envoye: false, raison: "engagement deja amorce aujourd'hui" });
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
  if (negliges.length === 1) return `« ${negliges[0].nom} » n'a pas bouge de la semaine.`;
  return `${negliges.length} objectifs n'ont pas bouge de la semaine.`;
}
