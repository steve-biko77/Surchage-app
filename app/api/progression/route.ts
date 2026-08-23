export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { seriesRepository, exercicesRepository } from "@/lib/adapters/repositories";
import { calculerProgressionV2, type MetriqueProgression } from "@/lib/domain/services";

const METRIQUES_VALIDES: MetriqueProgression[] = ["poids", "volume", "reps", "duree"];

// GET /api/progression?exerciceId=xxx&metrique=volume|poids|reps|duree
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exerciceId = searchParams.get("exerciceId");
  if (!exerciceId) return NextResponse.json({ error: "exerciceId requis" }, { status: 400 });

  const [seriesExo, exercice] = await Promise.all([
    seriesRepository.parExercice(exerciceId),
    exercicesRepository.parId(exerciceId),
  ]);
  if (!exercice) return NextResponse.json({ error: "exercice introuvable" }, { status: 404 });

  const result = calculerProgressionV2(seriesExo, exercice);

  const metriqueParam = searchParams.get("metrique");
  if (metriqueParam && METRIQUES_VALIDES.includes(metriqueParam as MetriqueProgression)) {
    result.metriquePrincipale = metriqueParam as MetriqueProgression;
  }

  return NextResponse.json(result);
}
