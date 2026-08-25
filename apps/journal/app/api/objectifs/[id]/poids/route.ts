export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { objectifsRepository } from "@/lib/adapters/repositories";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { poids } = await req.json();
  if (poids == null || poids < 0) {
    return NextResponse.json({ error: "poids invalide" }, { status: 400 });
  }
  const row = await objectifsRepository.setMeilleurPoidsAtteint(id, poids);
  return NextResponse.json(row);
}
