export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { objectifsRepository } from "@/lib/adapters/repositories";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { minutes } = await req.json();
  if (!minutes || minutes <= 0) {
    return NextResponse.json({ error: "minutes doit etre positif" }, { status: 400 });
  }
  const row = await objectifsRepository.ajouterMinutes(id, minutes);
  return NextResponse.json(row);
}
