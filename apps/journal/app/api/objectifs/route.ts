export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { ObjectifPerformance, ObjectifTemps } from "@productivity/core";
import { objectifsRepository } from "@/lib/adapters/repositories";

export async function GET() {
  const rows = await objectifsRepository.all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { nom, type, disciplineId, deadline, heuresCible, poidsCible } = await req.json();

  if (!nom) {
    return NextResponse.json({ error: "nom est requis" }, { status: 400 });
  }
  if (type !== "performance" && !heuresCible) {
    return NextResponse.json({ error: "heuresCible est requis pour un objectif temps" }, { status: 400 });
  }
  if (type === "performance" && !poidsCible) {
    return NextResponse.json({ error: "poidsCible est requis pour un objectif performance" }, { status: 400 });
  }

  const objectifDomaine =
    type === "performance"
      ? new ObjectifPerformance("", nom, disciplineId ?? "", deadline ?? null, poidsCible, 0)
      : new ObjectifTemps("", nom, disciplineId ?? "", deadline ?? null, heuresCible, 0);
  const estPerformance = objectifDomaine instanceof ObjectifPerformance;

  const row = await objectifsRepository.create({
    nom: objectifDomaine.nom,
    type: estPerformance ? "performance" : "temps",
    disciplineId: disciplineId || null,
    deadline: objectifDomaine.deadline,
    heuresCible: estPerformance ? null : heuresCible,
    poidsCible: estPerformance ? poidsCible : null,
  });

  return NextResponse.json(row, { status: 201 });
}
