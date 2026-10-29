export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { seancesPlanifieesRepository } from "@/lib/adapters/repositories";
import { resoudreSeanceDuJour } from "@/lib/adapters/seanceDuJour";
import { todayISO } from "@/lib/domain/services";

/**
 * PUT /api/seance-du-jour/ordre — fixe l'ordre des exercices du jour.
 *
 * Deux cas, et c'est le serveur qui les démêle plutôt que le client :
 *
 *   - la journée a déjà une séance planifiée : on réécrit sa liste ;
 *   - la séance vient d'un programme hebdomadaire : on MATÉRIALISE la journée
 *     en séance planifiée avec l'ordre demandé. Réorganiser aujourd'hui ne
 *     doit pas réécrire le modèle qui vaut pour tous les lundis à venir.
 *
 * La liste envoyée doit contenir exactement les exercices du jour, ni plus ni
 * moins : c'est une permutation, pas une édition de contenu. Un ajout ou une
 * suppression déguisés en réordonnancement seraient refusés ici.
 */
export async function PUT(req: Request) {
  const { exerciceIds } = await req.json().catch(() => ({ exerciceIds: null }));

  if (!Array.isArray(exerciceIds) || exerciceIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "exerciceIds doit etre un tableau d'identifiants" }, { status: 400 });
  }

  const { nomSeance, estPlanifiee, exercicesAvecCible } = await resoudreSeanceDuJour();
  if (!nomSeance || exercicesAvecCible.length === 0) {
    return NextResponse.json({ error: "aucune seance aujourd'hui" }, { status: 404 });
  }

  const actuels = exercicesAvecCible.map((e) => e.id);
  const memeEnsemble =
    exerciceIds.length === actuels.length &&
    new Set(exerciceIds).size === exerciceIds.length &&
    exerciceIds.every((id) => actuels.includes(id));
  if (!memeEnsemble) {
    return NextResponse.json(
      { error: "la liste doit contenir exactement les exercices de la seance" },
      { status: 400 }
    );
  }

  const today = todayISO();

  if (estPlanifiee) {
    const seances = await seancesPlanifieesRepository.parDate(today);
    const seance = seances[0];
    if (!seance) return NextResponse.json({ error: "seance introuvable" }, { status: 404 });
    const row = await seancesPlanifieesRepository.setExerciceIds(seance.id, exerciceIds);
    return NextResponse.json({ ordre: row?.exerciceIds ?? exerciceIds, materialisee: false });
  }

  const row = await seancesPlanifieesRepository.create({
    date: today,
    nom: nomSeance,
    exerciceIds,
    source: "manuel",
  });
  return NextResponse.json({ ordre: row.exerciceIds, materialisee: true });
}
