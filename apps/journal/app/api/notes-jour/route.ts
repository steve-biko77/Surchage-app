export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { notesJourRepository } from "@/lib/adapters/repositories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date est requis" }, { status: 400 });
  }
  const row = await notesJourRepository.parDate(date);
  return NextResponse.json(row);
}

export async function POST(req: Request) {
  const { date, texte } = await req.json();
  if (!date || typeof texte !== "string") {
    return NextResponse.json({ error: "date et texte sont requis" }, { status: 400 });
  }
  const row = await notesJourRepository.upsert(date, texte);
  return NextResponse.json(row);
}
