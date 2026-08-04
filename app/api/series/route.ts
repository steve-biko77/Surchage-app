import { NextResponse } from "next/server";
import { seriesRepository, objectifsRepository, exercicesRepository } from "@/lib/adapters/repositories";

export async function POST(req: Request) {
  const body = await req.json();
  const { date, exerciceId, poids, reps, sets, note } = body;
  if (!date || !exerciceId || !reps || !sets) {
    return NextResponse.json({ error: "date, exerciceId, reps et sets sont requis" }, { status: 400 });
  }
  const row = await seriesRepository.create({ date, exerciceId, poids: poids ?? 0, reps, sets, note: note ?? "" });

  // Incrementer l'objectif lie si l'exercice est priorise (Figure 5 / 5 bis)
  const [exo] = await exercicesRepository.all().then((all) => all.filter((e) => e.id === exerciceId));
  if (exo?.prioritaire && exo.objectifId) {
    const minutesEstimees = sets * 3; // heuristique simple : ~3min par serie
    await objectifsRepository.ajouterMinutes(exo.objectifId, minutesEstimees);
  }

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await seriesRepository.delete(id);
  return NextResponse.json({ ok: true });
}
