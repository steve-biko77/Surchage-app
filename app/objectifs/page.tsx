export const dynamic = "force-dynamic";

import { objectifsRepository, exercicesRepository, seriesRepository, objectifsExercicesRepository } from "@/lib/adapters/repositories";
import { calculerProgressionObjectifPerformance } from "@/lib/domain/services";
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

      if (type !== "performance" || exerciceIds.length === 0 || !o.poidsCible) {
        return { ...o, type, exerciceIds, progressionPerformance: null, meilleurPoids: null };
      }
      const seriesLiees = await seriesRepository.parExercices(exerciceIds);
      const progressionPerformance = calculerProgressionObjectifPerformance(seriesLiees, o.poidsCible);
      const meilleurPoids = seriesLiees.reduce((max, s) => Math.max(max, s.poids), 0);
      return { ...o, type, exerciceIds, progressionPerformance, meilleurPoids };
    })
  );

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-4">Objectifs</h2>
      <ObjectifsClient initialObjectifs={objectifsAvecProgression} exercices={exercices} />
    </div>
  );
}
