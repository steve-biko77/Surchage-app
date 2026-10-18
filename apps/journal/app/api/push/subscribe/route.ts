export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { pushSubscriptionsRepository } from "@/lib/adapters/repositories";

/** Enregistre (ou met a jour) l'abonnement d'un appareil. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;
  const p256dh: string | undefined = body?.keys?.p256dh;
  const auth: string | undefined = body?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "endpoint et keys.p256dh / keys.auth sont requis" },
      { status: 400 }
    );
  }

  const row = await pushSubscriptionsRepository.enregistrer({
    endpoint,
    p256dh,
    auth,
    libelle: typeof body?.libelle === "string" ? body.libelle.slice(0, 80) : null,
  });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}

/** Desabonne un appareil. */
export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;
  if (!endpoint) return NextResponse.json({ error: "endpoint requis" }, { status: 400 });
  await pushSubscriptionsRepository.supprimer(endpoint);
  return NextResponse.json({ ok: true });
}
