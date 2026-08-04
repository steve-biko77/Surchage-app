export const dynamic = "force-dynamic";

import { Target } from "lucide-react";
import { programmesRepository, exercicesRepository, seriesRepository, objectifsDuJourRepository } from "@/lib/adapters/repositories";
import { jourDeLaSemaine, todayISO, calculerCibleAuto, calculerNiveauFlamme } from "@/lib/domain/services";
import ExerciseCard from "@/components/ExerciseCard";
import FlameBadge from "@/components/FlameBadge";
import MuscleMap from "@/components/MuscleMap";

export default async function SeanceDuJourPage() {
  const jour = jourDeLaSemaine();
  const today = todayISO();

  const [programmesDuJour, tousExercices, toutesSeries, objectifDuJour] = await Promise.all([
    programmesRepository.parJour(jour),
    exercicesRepository.all(),
    seriesRepository.all(),
    objectifsDuJourRepository.parDate(today),
  ]);
  const programme = programmesDuJour[0] ?? null;

  const exoParId = new Map(tousExercices.map((e) => [e.id, e]));
  const septJoursAvant = new Date();
  septJoursAvant.setDate(septJoursAvant.getDate() - 6);
  const seuil = todayISO(septJoursAvant);
  const volumeParGroupe: Record<string, number> = {};
  for (const s of toutesSeries) {
    if (s.date < seuil || s.date > today) continue;
    const exo = exoParId.get(s.exerciceId);
    if (!exo) continue;
    volumeParGroupe[exo.groupeMusculaire] = (volumeParGroupe[exo.groupeMusculaire] ?? 0) + s.sets;
  }

  if (!programme) {
    return (
      <div>
        <MuscleMap volumeParGroupe={volumeParGroupe} />
        <div className="mt-4 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-card)] py-12 text-center text-[var(--grey)]">
          <p className="mb-2 text-base">
            Aucun programme configuré pour <b className="capitalize text-[#FF5A1F]">{jour}</b>.
          </p>
          <p className="text-sm">Configure ton split hebdomadaire pour que la séance du jour apparaisse ici automatiquement.</p>
        </div>
      </div>
    );
  }

  const exos = await exercicesRepository.parProgramme(programme.id);
  const exosTries = [...exos].sort((a, b) => Number(b.prioritaire) - Number(a.prioritaire) || a.ordre - b.ordre);

  const exercicesAvecCible = await Promise.all(
    exosTries.map(async (exo) => {
      const historique = await seriesRepository.parExercice(exo.id);
      const cible = calculerCibleAuto(historique, exo);
      const seriesAujourdhui = historique.filter((s) => s.date === today).map((s) => ({ id: s.id, poids: s.poids, reps: s.reps, sets: s.sets }));
      return { ...exo, cible, seriesAujourdhui };
    })
  );

  const totalSets = exercicesAvecCible.flatMap((e) => e.seriesAujourdhui).reduce((sum, s) => sum + s.sets, 0);
  const niveauFlamme = calculerNiveauFlamme(totalSets);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[var(--grey)] capitalize">{jour}</p>
          <h2 className="font-heading text-2xl font-bold leading-tight">{programme.nom}</h2>
        </div>
        <FlameBadge niveau={niveauFlamme} />
      </div>

      {objectifDuJour && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border-l-2 border-[#FF5A1F] bg-gradient-to-r from-[#2a1c10] to-transparent px-3 py-2.5 text-sm text-[#ffd8c2]">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5A1F]" aria-hidden="true" />
          <span><b>Objectif du jour :</b> {objectifDuJour.texte}</span>
        </div>
      )}

      <div className="mb-4">
        <MuscleMap volumeParGroupe={volumeParGroupe} />
      </div>

      {exercicesAvecCible.map((exo) => (
        <ExerciseCard key={exo.id} exercice={exo} />
      ))}
    </div>
  );
}
