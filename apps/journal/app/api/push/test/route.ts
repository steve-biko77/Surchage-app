export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { pushSubscriptionsRepository } from "@/lib/adapters/repositories";
import { envoyerPush, pushConfigure } from "@/lib/nudge/push";

/** Envoie une notification de test a tous les appareils abonnes. */
export async function POST() {
  if (!pushConfigure()) {
    return NextResponse.json(
      { error: "Cles VAPID absentes cote serveur" },
      { status: 503 }
    );
  }
  const abos = await pushSubscriptionsRepository.all();
  if (abos.length === 0) {
    return NextResponse.json({ error: "Aucun appareil abonne" }, { status: 404 });
  }

  const res = await envoyerPush(abos, {
    titre: "Journal",
    corps: "Test reussi — les notifications fonctionnent.",
    url: "/jour",
  });

  for (const e of res.perimes) await pushSubscriptionsRepository.supprimer(e);

  return NextResponse.json({ envoyes: res.envoyes, perimes: res.perimes.length, erreurs: res.erreurs });
}
