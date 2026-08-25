// Resolution partagee de "la seance du jour" (scenario B4, cf. bug H) - reutilisee
// par la page d'accueil et par /entrainement-en-cours pour ne jamais diverger.

import {
  programmesRepository, exercicesRepository, seriesRepository, seancesPlanifieesRepository,
} from "./repositories";
import { jourDeLaSemaine, todayISO, calculerCibleAuto } from "../domain/services";

export async function resoudreSeanceDuJour() {
  const jour = jourDeLaSemaine();
  const today = todayISO();

  const [programmesDuJour, tousExercices, seancesDuJour] = await Promise.all([
    programmesRepository.parJour(jour),
    exercicesRepository.all(),
    seancesPlanifieesRepository.parDate(today),
  ]);
  const exoParId = new Map(tousExercices.map((e) => [e.id, e]));

  // Resolution UNIQUEMENT par date, jamais par statut : le statut planifiee/realisee
  // ne sert qu'a l'affichage du calendrier (bug H).
  const seanceDuJour = seancesDuJour[0] ?? null;

  let nomSeance: string | null = null;
  let exosOrdonnes: typeof tousExercices = [];
  let estPlanifiee = false;

  if (seanceDuJour) {
    nomSeance = seanceDuJour.nom;
    estPlanifiee = true;
    exosOrdonnes = seanceDuJour.exerciceIds
      .map((id) => exoParId.get(id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
  } else {
    const programme = programmesDuJour[0] ?? null;
    if (programme) {
      nomSeance = programme.nom;
      const exos = await exercicesRepository.parProgramme(programme.id);
      exosOrdonnes = [...exos].sort((a, b) => Number(b.prioritaire) - Number(a.prioritaire) || a.ordre - b.ordre);
    }
  }

  const exercicesAvecCible = await Promise.all(
    exosOrdonnes.map(async (exo) => {
      const historique = await seriesRepository.parExercice(exo.id);
      const cible = calculerCibleAuto(historique, exo);
      const seriesAujourdhui = historique
        .filter((s) => s.date === today)
        .map((s) => ({ id: s.id, poids: s.poids, reps: s.reps, sets: s.sets, dureeSecondes: s.dureeSecondes, note: s.note }));
      return { ...exo, cible, seriesAujourdhui };
    })
  );

  return { jour, today, nomSeance, estPlanifiee, exercicesAvecCible, tousExercices };
}
