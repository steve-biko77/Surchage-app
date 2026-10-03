export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tachesRecurrentes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { tachesRecurrentesRepository } from "@/lib/adapters/repositories";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [existant] = await db.select().from(tachesRecurrentes).where(eq(tachesRecurrentes.id, id));
  if (!existant) {
    return NextResponse.json({ error: "Tache recurrente introuvable" }, { status: 404 });
  }
  const row = await tachesRecurrentesRepository.setActif(id, !existant.actif);
  return NextResponse.json(row);
}
