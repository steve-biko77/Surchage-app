export const dynamic = "force-dynamic";

import { programmesRepository, exercicesRepository, seriesRepository, objectifsDuJourRepository } from "@/lib/adapters/repositories";
import { jourDeLaSemaine, todayISO, calculerCibleAuto, calculerNiveauFlamme } from "@/lib/domain/services";
import ExerciseCard from "@/components/ExerciseCard";
import FlameBadge from "@/components/FlameBadge";

export default async function SeanceDuJourPage() {
  const jour = jourDeLaSemaine();
  const today = todayISO();

  const programmesDuJour = await programmesRepository.parJour(jour);
  const programme = programmesDuJour[0] ?? null;

  if (!programme) {
    return (
      <div className="text-center py-16 text-[#8b8d98]">
        <p className="text-lg mb-2">Aucun programme configuré pour <b className="text-[#FF5A1F] capitalize">{jour}</b>.</p>
        <p className="text-sm">Configure ton split hebdomadaire pour que la séance du jour apparaisse ici automatiquement.</p>
      </div>
    );
  }

  const exos = await exercicesRepository.parProgramme(programme.id);
  const exosTries = [...exos].sort((a, b) => Number(b.prioritaire) - Number(a.prioritaire) || a.ordre - b.ordre);

  const exercicesAvecCible = await Promise.all(
    exosTries.map(async (exo) => {
      const historique = await seriesRepository.parExercice(exo.id);
      const cible = calculerCibleAuto(historique);
      const seriesAujourdhui = historique.filter((s) => s.date === today).map((s) => ({ id: s.id, poids: s.poids, reps: s.reps, sets: s.sets }));
      return { ...exo, cible, seriesAujourdhui };
    })
  );

  const totalSets = exercicesAvecCible.flatMap((e) => e.seriesAujourdhui).reduce((sum, s) => sum + s.sets, 0);
  const niveauFlamme = calculerNiveauFlamme(totalSets);
  const objectifDuJour = await objectifsDuJourRepository.parDate(today);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#8b8d98] capitalize">{jour}</p>
          <h2 className="text-xl font-bold">{programme.nom}</h2>
        </div>
        <FlameBadge niveau={niveauFlamme} />
      </div>

      {objectifDuJour && (
        <div className="mb-4 rounded-lg border-l-2 border-[#FF5A1F] bg-gradient-to-r from-[#2a1c10] to-transparent px-3 py-2 text-sm text-[#ffd8c2]">
          🎯 <b>Objectif du jour :</b> {objectifDuJour.texte}
        </div>
      )}

      {exercicesAvecCible.map((exo) => (
        <ExerciseCard key={exo.id} exercice={exo} />
      ))}
    </div>
  );
}
