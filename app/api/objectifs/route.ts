export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { objectifsRepository } from "@/lib/adapters/repositories";

export async function GET() {
  const rows = await objectifsRepository.all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { nom, disciplineId, heuresCible, deadline, type, exerciceId, poidsCible } = await req.json();
  const typeObjectif = type === "performance" ? "performance" : "temps";

  if (!nom) {
    return NextResponse.json({ error: "nom est requis" }, { status: 400 });
  }
  if (typeObjectif === "temps" && !heuresCible) {
    return NextResponse.json({ error: "heuresCible est requis pour un objectif temps" }, { status: 400 });
  }
  if (typeObjectif === "performance" && (!exerciceId || !poidsCible)) {
    return NextResponse.json({ error: "exerciceId et poidsCible sont requis pour un objectif performance" }, { status: 400 });
  }

  const row = await objectifsRepository.create({
    nom,
    disciplineId: disciplineId ?? null,
    heuresCible: typeObjectif === "temps" ? heuresCible : 0,
    deadline,
    type: typeObjectif,
    exerciceId: typeObjectif === "performance" ? exerciceId : null,
    poidsCible: typeObjectif === "performance" ? poidsCible : null,
  });
  return NextResponse.json(row, { status: 201 });
}
