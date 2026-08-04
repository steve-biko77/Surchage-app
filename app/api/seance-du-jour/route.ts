export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { programmesRepository, exercicesRepository, seriesRepository, objectifsDuJourRepository } from "@/lib/adapters/repositories";
import { jourDeLaSemaine, todayISO, calculerCibleAuto, calculerNiveauFlamme } from "@/lib/domain/services";

// GET /api/seance-du-jour - la route centrale du module (scenario S1/S5)
export async function GET() {
  const jour = jourDeLaSemaine();
  const today = todayISO();

  const programmesDuJour = await programmesRepository.parJour(jour);
  const programme = programmesDuJour[0] ?? null;

  if (!programme) {
    return NextResponse.json({ jour, programme: null, exercices: [], objectifDuJour: null });
  }

  const exos = await exercicesRepository.parProgramme(programme.id);
  // Exercices prioritaires (etoiles) en tete - Figure 5 / 5 bis
  const exosTries = [...exos].sort((a, b) => Number(b.prioritaire) - Number(a.prioritaire) || a.ordre - b.ordre);

  const exercicesAvecCible = await Promise.all(
    exosTries.map(async (exo) => {
      const historique = await seriesRepository.parExercice(exo.id);
      const cible = calculerCibleAuto(historique);
      const seriesAujourdhui = historique.filter((s) => s.date === today);
      return { ...exo, cible, seriesAujourdhui };
    })
  );

  const toutesSeriesAujourdhui = exercicesAvecCible.flatMap((e) => e.seriesAujourdhui);
  const totalSets = toutesSeriesAujourdhui.reduce((sum, s) => sum + s.sets, 0);
  const niveauFlamme = calculerNiveauFlamme(totalSets);

  const objectifDuJour = await objectifsDuJourRepository.parDate(today);

  return NextResponse.json({
    jour,
    date: today,
    programme,
    exercices: exercicesAvecCible,
    niveauFlamme,
    objectifDuJour: objectifDuJour?.texte ?? null,
  });
}
