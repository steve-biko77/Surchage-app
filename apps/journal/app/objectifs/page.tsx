export const dynamic = "force-dynamic";
import { objectifsRepository } from "@/lib/adapters/repositories";
import { objectifDepuisRow } from "@/lib/domain/mappers";
import ObjectifsClient from "@/components/ObjectifsClient";

export default async function ObjectifsPage() {
  const rows = await objectifsRepository.all();

  // Polymorphisme : chaque instance (ObjectifTemps/ObjectifMetrique) sait
  // calculer sa propre progression, pas de branchement manuel ici.
  const objectifs = rows.map((row) => {
    const instance = objectifDepuisRow(row);
    return {
      id: row.id,
      nom: row.nom,
      type: row.type as "temps" | "metrique",
      deadline: row.deadline,
      heuresCible: row.heuresCible,
      minutesInvesties: row.minutesInvesties,
      rawUnite: row.unite,
      valeurCible: row.valeurCible,
      valeurActuelle: row.valeurActuelle,
      progression: instance.calculerProgression(),
      unite: instance.describeUnite(),
    };
  });

  const moyenne =
    objectifs.length > 0
      ? Math.round(objectifs.reduce((s, o) => s + o.progression, 0) / objectifs.length)
      : 0;

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Objectifs</h1>
          <p className="page-sub">
            {objectifs.length === 0
              ? "Rien à viser pour l'instant."
              : `${objectifs.length} objectif${objectifs.length > 1 ? "s" : ""} suivi${objectifs.length > 1 ? "s" : ""} · ${moyenne}% de progression moyenne.`}
          </p>
        </div>
      </header>

      <ObjectifsClient initialObjectifs={objectifs} />
    </>
  );
}
