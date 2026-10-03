export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { tachesRecurrentesRepository } from "@/lib/adapters/repositories";

export async function GET() {
  const rows = await tachesRecurrentesRepository.all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { texte, frequence, joursSemaine, heure, objectifId } = await req.json();

  if (!texte || !frequence) {
    return NextResponse.json({ error: "texte et frequence sont requis" }, { status: 400 });
  }
  if (frequence !== "journaliere" && frequence !== "hebdomadaire") {
    return NextResponse.json({ error: "frequence doit etre journaliere ou hebdomadaire" }, { status: 400 });
  }
  if (frequence === "hebdomadaire" && (!Array.isArray(joursSemaine) || joursSemaine.length === 0)) {
    return NextResponse.json({ error: "joursSemaine est requis pour une tache hebdomadaire" }, { status: 400 });
  }

  const row = await tachesRecurrentesRepository.create({
    texte,
    frequence,
    joursSemaine: frequence === "hebdomadaire" ? joursSemaine : [],
    heure: heure || null,
    objectifId: objectifId || null,
  });

  return NextResponse.json(row, { status: 201 });
}
