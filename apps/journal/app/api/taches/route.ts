export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { tachesRepository } from "@/lib/adapters/repositories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date est requis" }, { status: 400 });
  }
  const rows = await tachesRepository.parDate(date);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { date, texte, heure, objectifId } = await req.json();
  if (!date || !texte) {
    return NextResponse.json({ error: "date et texte sont requis" }, { status: 400 });
  }
  const row = await tachesRepository.create({
    date,
    texte,
    heure: heure || null,
    objectifId: objectifId || null,
  });
  return NextResponse.json(row, { status: 201 });
}
