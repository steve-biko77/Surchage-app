export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { seancesPlanifieesRepository } from "@/lib/adapters/repositories";
import { todayISO } from "@/lib/domain/services";

// GET /api/seances-planifiees?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? todayISO();
  const to = searchParams.get("to") ?? from;
  const rows = await seancesPlanifieesRepository.entreDates(from, to);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { date, nom, disciplineId, exerciceIds, source } = await req.json();
  if (!date || !nom || !Array.isArray(exerciceIds) || exerciceIds.length === 0) {
    return NextResponse.json({ error: "date, nom et exerciceIds (non vide) sont requis" }, { status: 400 });
  }
  const row = await seancesPlanifieesRepository.create({
    date, nom, disciplineId: disciplineId ?? null, exerciceIds, source: source ?? "manuel",
  });
  return NextResponse.json(row, { status: 201 });
}
