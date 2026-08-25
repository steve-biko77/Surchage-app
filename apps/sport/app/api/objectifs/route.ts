export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { objectifsRepository, objectifsExercicesRepository } from "@/lib/adapters/repositories";

export async function GET() {
  const rows = await objectifsRepository.all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { nom, disciplineId, heuresCible, deadline, type, exerciceIds, poidsCible } = await req.json();
  const typeObjectif = type === "performance" ? "performance" : "temps";
  const liens: string[] = Array.isArray(exerciceIds) ? exerciceIds : [];

  if (!nom) {
    return NextResponse.json({ error: "nom est requis" }, { status: 400 });
  }
  if (typeObjectif === "temps" && !heuresCible) {
    return NextResponse.json({ error: "heuresCible est requis pour un objectif temps" }, { status: 400 });
  }
  if (typeObjectif === "performance" && (liens.length === 0 || !poidsCible)) {
    return NextResponse.json({ error: "au moins un exercice et poidsCible sont requis pour un objectif performance" }, { status: 400 });
  }

  const row = await objectifsRepository.create({
    nom,
    disciplineId: disciplineId ?? null,
    heuresCible: typeObjectif === "temps" ? heuresCible : 0,
    deadline,
    type: typeObjectif,
    poidsCible: typeObjectif === "performance" ? poidsCible : null,
  });

  if (typeObjectif === "performance" && liens.length > 0) {
    await objectifsExercicesRepository.setLiens(row.id, liens);
  }

  return NextResponse.json(row, { status: 201 });
}
