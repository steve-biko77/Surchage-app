export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { tachesRepository } from "@/lib/adapters/repositories";
import { retirerRappel } from "@/lib/nudge/rappels";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Ecartee explicitement : son rappel n'a plus lieu d'etre.
  await retirerRappel(id);
  const row = await tachesRepository.ignorer(id);
  return NextResponse.json(row);
}
