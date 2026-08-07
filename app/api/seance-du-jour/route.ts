export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { objectifsDuJourRepository } from "@/lib/adapters/repositories";
import { resoudreSeanceDuJour } from "@/lib/adapters/seanceDuJour";
import { calculerNiveauFlamme, calculerResumeSeance } from "@/lib/domain/services";

// GET /api/seance-du-jour - la route centrale du module (scenario S1/S5)
export async function GET() {
  const { jour, today, nomSeance, estPlanifiee, exercicesAvecCible, tousExercices } = await resoudreSeanceDuJour();
  const objectifDuJour = await objectifsDuJourRepository.parDate(today);

  const groupeParExercice = Object.fromEntries(tousExercices.map((e) => [e.id, e.groupeMusculaire]));
  const toutesSeriesAujourdhui = exercicesAvecCible.flatMap((e) => e.seriesAujourdhui);
  const resume = calculerResumeSeance(
    exercicesAvecCible.flatMap((e) => e.seriesAujourdhui.map((s) => ({ exerciceId: e.id, sets: s.sets, reps: s.reps }))),
    groupeParExercice
  );

  if (!nomSeance) {
    return NextResponse.json({ jour, programme: null, exercices: [], objectifDuJour: null, resume });
  }

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
