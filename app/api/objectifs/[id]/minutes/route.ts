import { NextResponse } from "next/server";
import { objectifsRepository } from "@/lib/adapters/repositories";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { minutes } = await req.json();
  const row = await objectifsRepository.ajouterMinutes(id, minutes);
  return NextResponse.json(row);
}
