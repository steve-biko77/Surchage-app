export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { echangerCodeContreTokens } from "@/lib/google/auth";
import { creerCalendrierSecondaire, creerEvenementAncrage } from "@/lib/google/calendar";
import { googleAuthRepository, journalCalendarRepository } from "@/lib/adapters/repositories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const erreur = searchParams.get("error");

  if (erreur) {
    return NextResponse.json({ error: `Consentement Google refuse : ${erreur}` }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "code manquant" }, { status: 400 });
  }

  const { refreshToken } = await echangerCodeContreTokens(code);
  if (!refreshToken) {
    return NextResponse.json(
      { error: "Aucun refresh_token recu -- revoque l'acces de l'app dans myaccount.google.com/permissions puis reessaie." },
      { status: 400 }
    );
  }
  // Ne jamais logger refreshToken en clair.
  await googleAuthRepository.enregistrerRefreshToken(refreshToken);

  // Au premier usage : cree le calendrier secondaire + l'evenement d'ancrage une seule fois.
  let calendrier = await journalCalendarRepository.get();
  if (!calendrier) {
    const googleCalendarId = await creerCalendrierSecondaire("Journal — Rappels");
    calendrier = await journalCalendarRepository.enregistrer(googleCalendarId);
    await creerEvenementAncrage(googleCalendarId);
  }

  return NextResponse.json({
    ok: true,
    message: "Google Calendar connecte. Calendrier 'Journal — Rappels' et ancrage 6h00 en place.",
  });
}
