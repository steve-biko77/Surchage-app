export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import {
  programmesRepository, exercicesRepository, seriesRepository, objectifsDuJourRepository,
  seancesPlanifieesRepository,
} from "@/lib/adapters/repositories";
import { jourDeLaSemaine, todayISO, calculerCibleAuto, calculerNiveauFlamme, calculerResumeSeance } from "@/lib/domain/services";

// GET /api/seance-du-jour - la route centrale du module (scenario S1/S5)
export async function GET() {
  const jour = jourDeLaSemaine();
  const today = todayISO();

  const [programmesDuJour, tousExercices, toutesSeries, objectifDuJour, seancesDuJour] = await Promise.all([
    programmesRepository.parJour(jour),
    exercicesRepository.all(),
    seriesRepository.all(),
    objectifsDuJourRepository.parDate(today),
    seancesPlanifieesRepository.parDate(today),
  ]);

  const exoParId = new Map(tousExercices.map((e) => [e.id, e]));
  const groupeParExercice = Object.fromEntries(tousExercices.map((e) => [e.id, e.groupeMusculaire]));
  const resume = calculerResumeSeance(
    toutesSeries.filter((s) => s.date === today),
    groupeParExercice
  );

  // Resolution UNIQUEMENT par date, jamais par statut (bug H) : le statut
  // planifiee/realisee ne pilote que l'affichage du calendrier.
  const seanceDuJour = seancesDuJour[0] ?? null;

  let nomSeance: string | null = null;
  let exosOrdonnes: typeof tousExercices = [];
  const estPlanifiee = Boolean(seanceDuJour);

  if (seanceDuJour) {
    nomSeance = seanceDuJour.nom;
    exosOrdonnes = seanceDuJour.exerciceIds
      .map((id) => exoParId.get(id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
  } else {
    const programme = programmesDuJour[0] ?? null;
    if (!programme) {
      return NextResponse.json({ jour, programme: null, exercices: [], objectifDuJour: null, resume });
    }
    nomSeance = programme.nom;
    const exos = await exercicesRepository.parProgramme(programme.id);
    exosOrdonnes = [...exos].sort((a, b) => Number(b.prioritaire) - Number(a.prioritaire) || a.ordre - b.ordre);
  }

  const exercicesAvecCible = await Promise.all(
    exosOrdonnes.map(async (exo) => {
      const historique = await seriesRepository.parExercice(exo.id);
      const cible = calculerCibleAuto(historique, exo);
      const seriesAujourdhui = historique.filter((s) => s.date === today);
      return { ...exo, cible, seriesAujourdhui };
    })
  );

  const toutesSeriesAujourdhui = exercicesAvecCible.flatMap((e) => e.seriesAujourdhui);
  const totalSets = toutesSeriesAujourdhui.reduce((sum, s) => sum + s.sets, 0);
  const niveauFlamme = calculerNiveauFlamme(totalSets);

  return NextResponse.json({
    jour,
    date: today,
    programme: { nom: nomSeance },
    estPlanifiee,
    exercices: exercicesAvecCible,
    niveauFlamme,
    resume,
    objectifDuJour: objectifDuJour?.texte ?? null,
  });
}
