export const dynamic = "force-dynamic";

import { objectifsRepository, exercicesRepository, seriesRepository } from "@/lib/adapters/repositories";
import { calculerProgressionObjectifPerformance } from "@/lib/domain/services";
import ObjectifsClient from "@/components/ObjectifsClient";

export default async function ObjectifsPage() {
  const [objectifs, exercices] = await Promise.all([
    objectifsRepository.all(),
    exercicesRepository.all(),
  ]);

  const objectifsAvecProgression = await Promise.all(
    objectifs.map(async (o) => {
      const type = o.type === "performance" ? ("performance" as const) : ("temps" as const);
      if (type !== "performance" || !o.exerciceId || !o.poidsCible) {
        return { ...o, type, progressionPerformance: null, meilleurPoids: null };
      }
      const seriesExo = await seriesRepository.parExercice(o.exerciceId);
      const progressionPerformance = calculerProgressionObjectifPerformance(seriesExo, o.poidsCible);
      const meilleurPoids = seriesExo.reduce((max, s) => Math.max(max, s.poids), 0);
      return { ...o, type, progressionPerformance, meilleurPoids };
    })
  );

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-4">Objectifs</h2>
      <ObjectifsClient initialObjectifs={objectifsAvecProgression} exercices={exercices} />
    </div>
  );
}
