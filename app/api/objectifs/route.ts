import { NextResponse } from "next/server";
import { objectifsRepository } from "@/lib/adapters/repositories";

export async function GET() {
  const rows = await objectifsRepository.all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { nom, disciplineId, heuresCible, deadline } = await req.json();
  if (!nom || !heuresCible) {
    return NextResponse.json({ error: "nom et heuresCible sont requis" }, { status: 400 });
  }
  const row = await objectifsRepository.create({ nom, disciplineId: disciplineId ?? null, heuresCible, deadline });
  return NextResponse.json(row, { status: 201 });
}
