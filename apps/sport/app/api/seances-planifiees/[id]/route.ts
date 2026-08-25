export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { seancesPlanifieesRepository } from "@/lib/adapters/repositories";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { statut } = await req.json();
  if (statut !== "planifiee" && statut !== "realisee") {
    return NextResponse.json({ error: "statut invalide" }, { status: 400 });
  }
  const row = await seancesPlanifieesRepository.setStatut(id, statut);
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await seancesPlanifieesRepository.delete(id);
  return NextResponse.json({ ok: true });
}
