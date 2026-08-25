export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { tachesRepository } from "@/lib/adapters/repositories";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await tachesRepository.toggleFait(id);
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await tachesRepository.delete(id);
  return NextResponse.json({ ok: true });
}
