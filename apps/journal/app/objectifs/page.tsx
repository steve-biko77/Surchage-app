export const dynamic = "force-dynamic";
import { objectifsRepository } from "@/lib/adapters/repositories";
import { objectifDepuisRow } from "@/lib/domain/mappers";
import ObjectifsClient from "@/components/ObjectifsClient";

export default async function ObjectifsPage() {
  const rows = await objectifsRepository.all();

  // Polymorphisme : chaque instance (ObjectifTemps/ObjectifPerformance) sait
  // calculer sa propre progression, pas de branchement manuel ici.
  const objectifs = rows.map((row) => {
    const instance = objectifDepuisRow(row);
    return {
      id: row.id,
      nom: row.nom,
      type: row.type as "temps" | "performance",
      deadline: row.deadline,
      heuresCible: row.heuresCible,
      minutesInvesties: row.minutesInvesties,
      poidsCible: row.poidsCible,
      meilleurPoidsAtteint: row.meilleurPoidsAtteint,
      progression: instance.calculerProgression(),
      unite: instance.describeUnite(),
    };
  });

  return <ObjectifsClient initialObjectifs={objectifs} />;
}
