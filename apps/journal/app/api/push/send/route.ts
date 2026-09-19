export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { envoyerATous } from "@/lib/push/send";
import { autoriseAppelInterne } from "@/lib/push/auth";

/**
 * Route interne d'envoi de notification a tous les abonnes.
 * Protegee par le meme secret que /api/cron/nudge -- utile pour tester
 * manuellement l'infra push (curl) independamment de la logique adaptative.
 */
export async function POST(req: Request) {
  if (!autoriseAppelInterne(req)) {
    return NextResponse.json({ error: "non autorise" }, { status: 401 });
  }
  const { title, body, url } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title et body sont requis" }, { status: 400 });
  }
  const resultat = await envoyerATous({ title, body, url });
  return NextResponse.json(resultat);
}
