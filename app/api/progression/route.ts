import { NextResponse } from "next/server";
import { seriesRepository } from "@/lib/adapters/repositories";
import { calculerProgression } from "@/lib/domain/services";

// GET /api/progression?exerciceId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exerciceId = searchParams.get("exerciceId");
  if (!exerciceId) return NextResponse.json({ error: "exerciceId requis" }, { status: 400 });
  const seriesExo = await seriesRepository.parExercice(exerciceId);
  const result = calculerProgression(seriesExo);
  return NextResponse.json(result);
}
