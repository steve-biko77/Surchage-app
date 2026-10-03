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

  return <ObjectifsClient initialObjectifs={objectifs} />;
}
