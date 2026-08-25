export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { ObjectifPerformance, ObjectifTemps } from "@productivity/core";
import { objectifsRepository, objectifsExercicesRepository } from "@/lib/adapters/repositories";

export async function GET() {
  const rows = await objectifsRepository.all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { nom, disciplineId, heuresCible, deadline, type, exerciceIds, poidsCible } = await req.json();
  const liens: string[] = Array.isArray(exerciceIds) ? exerciceIds : [];

  if (!nom) {
    return NextResponse.json({ error: "nom est requis" }, { status: 400 });
  }
  if (type !== "performance" && !heuresCible) {
    return NextResponse.json({ error: "heuresCible est requis pour un objectif temps" }, { status: 400 });
  }
  if (type === "performance" && (liens.length === 0 || !poidsCible)) {
    return NextResponse.json({ error: "au moins un exercice et poidsCible sont requis pour un objectif performance" }, { status: 400 });
  }

  // La construction de l'instance de domaine fixe, par le type concret, quelles
  // colonnes sont pertinentes - pas de ternaire type==="..." disperse ailleurs.
  const objectifDomaine =
    type === "performance"
      ? new ObjectifPerformance("", nom, disciplineId ?? "", deadline ?? null, poidsCible, 0)
      : new ObjectifTemps("", nom, disciplineId ?? "", deadline ?? null, heuresCible, 0);
  const estPerformance = objectifDomaine instanceof ObjectifPerformance;

  const row = await objectifsRepository.create({
    nom: objectifDomaine.nom,
    disciplineId: disciplineId ?? null,
    heuresCible: estPerformance ? 0 : heuresCible,
    deadline: objectifDomaine.deadline,
    type: estPerformance ? "performance" : "temps",
    poidsCible: estPerformance ? poidsCible : null,
  });

  if (estPerformance && liens.length > 0) {
    await objectifsExercicesRepository.setLiens(row.id, liens);
  }

  return NextResponse.json(row, { status: 201 });
}
