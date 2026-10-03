export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { autoriseAppelInterne } from "@/lib/nudge/auth";
import { tachesRepository, joursValidesRepository, nudgeStateRepository, journalCalendarRepository } from "@/lib/adapters/repositories";
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
    const calendrier = await journalCalendarRepository.get();
    if (!calendrier) {
      return NextResponse.json(
        { envoye: false, raison: "Google Calendar non connecte -- visite /api/auth/google/start" },
        { status: 409 }
      );
    }
    await creerEvenementRappel(calendrier.googleCalendarId, message);
    await nudgeStateRepository.enregistrerNotification(message);
    return NextResponse.json({ envoye: true, message });
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

  return NextResponse.json({ envoye: false, raison: "engagement deja amorce aujourd'hui" });
}
