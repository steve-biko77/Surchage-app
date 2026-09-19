export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { pushSubscriptionsRepository } from "@/lib/adapters/repositories";

export async function POST(req: Request) {
  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "abonnement push invalide" }, { status: 400 });
  }
  const row = await pushSubscriptionsRepository.enregistrer({
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json();
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint est requis" }, { status: 400 });
  }
  await pushSubscriptionsRepository.supprimer(endpoint);
  return NextResponse.json({ ok: true });
}
