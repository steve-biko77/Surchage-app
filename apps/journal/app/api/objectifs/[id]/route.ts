export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { objectifsRepository } from "@/lib/adapters/repositories";

/** Met a jour le rythme vise (jours par semaine). `null` le retire. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const brut = (body as { joursParSemaine?: unknown }).joursParSemaine;

  if (brut === undefined) {
    return NextResponse.json({ error: "joursParSemaine est requis" }, { status: 400 });
  }
  if (brut !== null && (typeof brut !== "number" || !Number.isInteger(brut) || brut < 1 || brut > 7)) {
    return NextResponse.json({ error: "joursParSemaine doit etre un entier de 1 a 7, ou null" }, { status: 400 });
  }

  const row = await objectifsRepository.setJoursParSemaine(id, brut as number | null);
  if (!row) return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await objectifsRepository.delete(id);
  return NextResponse.json({ ok: true });
}
