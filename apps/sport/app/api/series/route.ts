export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import {
  seriesRepository, objectifsRepository, exercicesRepository,
  objectifsExercicesRepository, seancesPlanifieesRepository,
} from "@/lib/adapters/repositories";

export async function POST(req: Request) {
  const body = await req.json();
  const { date, exerciceId, poids, reps, sets, dureeSecondes, note } = body;
  if (!date || !exerciceId || !sets || (dureeSecondes == null && !reps)) {
    return NextResponse.json({ error: "date, exerciceId, sets et (reps ou dureeSecondes) sont requis" }, { status: 400 });
  }
  const row = await seriesRepository.create({
    date, exerciceId, poids: poids ?? 0, reps: reps ?? 0, sets,
    dureeSecondes: dureeSecondes ?? null, note: note ?? "",
  });

  // Incrementer les objectifs "temps" lies si l'exercice est priorise (Figure 5 / 5 bis)
  const exo = await exercicesRepository.parId(exerciceId);
  if (exo?.prioritaire) {
    const liens = await objectifsExercicesRepository.parExercice(exerciceId);
    const minutesEstimees = sets * 3; // heuristique simple : ~3min par serie
    for (const lien of liens) {
      const objectif = await objectifsRepository.parId(lien.objectifId);
      if (objectif?.type === "temps") {
        await objectifsRepository.ajouterMinutes(objectif.id, minutesEstimees);
      }
    }
  }

  // Si une seance planifiee du jour contient cet exercice, la marquer "realisee" (scenario B4)
  const seancesDuJour = await seancesPlanifieesRepository.parDate(date);
  for (const seance of seancesDuJour) {
    if (seance.statut === "planifiee" && seance.exerciceIds.includes(exerciceId)) {
      await seancesPlanifieesRepository.setStatut(seance.id, "realisee");
    }
  }

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await seriesRepository.delete(id);
  return NextResponse.json({ ok: true });
}
