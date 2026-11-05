export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { tachesRepository } from "@/lib/adapters/repositories";
import { planifierRappel, retirerRappel } from "@/lib/nudge/rappels";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await tachesRepository.toggleFait(id);
  // Un rappel pour une tache deja faite est la facon la plus sure de faire
  // couper les notifications : on le retire des qu'elle est cochee, et on le
  // repose si elle est decochee.
  if (row.fait) await retirerRappel(id);
  else await planifierRappel(row);
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await retirerRappel(id);
  await tachesRepository.delete(id);
  return NextResponse.json({ ok: true });
}
