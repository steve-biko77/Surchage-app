export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { objectifsRepository } from "@/lib/adapters/repositories";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await objectifsRepository.delete(id);
  return NextResponse.json({ ok: true });
}
