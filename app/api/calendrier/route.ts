import { NextResponse } from "next/server";
import { seriesRepository } from "@/lib/adapters/repositories";
import { calculerNiveauFlamme } from "@/lib/domain/services";

// GET /api/calendrier?annee=2026&mois=8
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const toutesLesSeries = await seriesRepository.all();

  const parJour: Record<string, number> = {};
  for (const s of toutesLesSeries) {
    parJour[s.date] = (parJour[s.date] ?? 0) + s.sets;
  }
  const flammesParJour = Object.fromEntries(
    Object.entries(parJour).map(([date, total]) => [date, calculerNiveauFlamme(total)])
  );

  return NextResponse.json({ flammesParJour });
}
