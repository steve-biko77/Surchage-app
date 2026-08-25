export const dynamic = "force-dynamic";

import { objectifsRepository, exercicesRepository, seriesRepository, objectifsExercicesRepository } from "@/lib/adapters/repositories";
import { objectifDepuisRow } from "@/lib/domain/objectifMapper";
import ObjectifsClient from "@/components/ObjectifsClient";

export default async function ObjectifsPage() {
  const [objectifs, exercices, tousLesLiens] = await Promise.all([
    objectifsRepository.all(),
    exercicesRepository.all(),
    objectifsExercicesRepository.all(),
  ]);

  const objectifsAvecProgression = await Promise.all(
    objectifs.map(async (o) => {
      const type = o.type === "performance" ? ("performance" as const) : ("temps" as const);
      const exerciceIds = tousLesLiens.filter((l) => l.objectifId === o.id).map((l) => l.exerciceId);

      const seriesLiees = type === "performance" && exerciceIds.length > 0
        ? await seriesRepository.parExercices(exerciceIds)
        : [];
      const meilleurPoids = seriesLiees.reduce((max, s) => Math.max(max, s.poids), 0);

      // Polymorphisme : ObjectifTemps et ObjectifPerformance savent chacun
      // calculer leur propre progression, plus besoin de brancher sur le type ici.
      const instance = objectifDepuisRow(o, meilleurPoids);
      const progression = instance.calculerProgression();
      const unite = instance.describeUnite();

      return { ...o, type, exerciceIds, progression, unite, meilleurPoids: type === "performance" ? meilleurPoids : null };
    })
  );

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-4">Objectifs</h2>
      <ObjectifsClient initialObjectifs={objectifsAvecProgression} exercices={exercices} />
    </div>
  );
}
