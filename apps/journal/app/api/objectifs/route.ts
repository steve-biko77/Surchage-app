export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { ObjectifMetrique, ObjectifTemps } from "@productivity/core";
import { objectifsRepository } from "@/lib/adapters/repositories";

export async function GET() {
  const rows = await objectifsRepository.all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { nom, type, disciplineId, deadline, heuresCible, unite, valeurDepart, valeurCible, sens } = await req.json();

  if (!nom) {
    return NextResponse.json({ error: "nom est requis" }, { status: 400 });
  }
  if (type !== "metrique" && !heuresCible) {
    return NextResponse.json({ error: "heuresCible est requis pour un objectif temps" }, { status: 400 });
  }
  if (type === "metrique" && (!unite || valeurCible == null)) {
    return NextResponse.json({ error: "unite et valeurCible sont requis pour un objectif metrique" }, { status: 400 });
  }

  const depart = valeurDepart ?? 0;
  const objectifDomaine =
    type === "metrique"
      ? new ObjectifMetrique("", nom, disciplineId ?? "", deadline ?? null, unite, depart, valeurCible, depart, sens === "decroissant" ? "decroissant" : "croissant")
      : new ObjectifTemps("", nom, disciplineId ?? "", deadline ?? null, heuresCible, 0);
  const estMetrique = objectifDomaine instanceof ObjectifMetrique;

  const row = await objectifsRepository.create({
    nom: objectifDomaine.nom,
    type: estMetrique ? "metrique" : "temps",
    disciplineId: disciplineId || null,
    deadline: objectifDomaine.deadline,
    heuresCible: estMetrique ? null : heuresCible,
    unite: estMetrique ? unite : null,
    valeurDepart: estMetrique ? depart : null,
    valeurCible: estMetrique ? valeurCible : null,
    valeurActuelle: estMetrique ? depart : null,
    sens: estMetrique ? (sens === "decroissant" ? "decroissant" : "croissant") : null,
  });

  return NextResponse.json(row, { status: 201 });
}
