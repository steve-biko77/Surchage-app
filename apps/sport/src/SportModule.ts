// Point de branchement Sport <-> Jarvis (note d'architecture, §4).
// Pas encore instancie ni appele nulle part : ce fichier valide uniquement
// que Sport respecte le contrat JarvisModule avant de le connecter a quoi que ce soit.
import { DisciplineSport, JarvisModule, type Discipline, type Objectif } from "@productivity/core";
import {
  disciplinesRepository,
  objectifsRepository,
  objectifsExercicesRepository,
  seriesRepository,
} from "../lib/adapters/repositories";
import { objectifDepuisRow } from "../lib/domain/objectifMapper";

export class SportModule extends JarvisModule {
  readonly id = "sport";
  readonly nom = "Sport";
  readonly icone = "🏋️";

  async getDisciplines(): Promise<Discipline[]> {
    const rows = await disciplinesRepository.all();
    return rows.map((r) => new DisciplineSport(r.id, r.nom, r.couleur, this.icone));
  }

  async getObjectifsActifs(): Promise<Objectif[]> {
    const [rows, tousLesLiens] = await Promise.all([
      objectifsRepository.all(),
      objectifsExercicesRepository.all(),
    ]);

    return Promise.all(
      rows.map(async (row) => {
        if (row.type !== "performance") return objectifDepuisRow(row);
        const exerciceIds = tousLesLiens.filter((l) => l.objectifId === row.id).map((l) => l.exerciceId);
        const seriesLiees = exerciceIds.length > 0 ? await seriesRepository.parExercices(exerciceIds) : [];
        const meilleurPoids = seriesLiees.reduce((max, s) => Math.max(max, s.poids), 0);
        return objectifDepuisRow(row, meilleurPoids);
      })
    );
  }

  async onDailyTick(_date: string): Promise<void> {
    // Rien a faire pour l'instant : la flamme Sport est recalculee a la volee
    // depuis les series du jour, pas persistee ni decroissante.
  }

  async getResumeDuJour(date: string): Promise<{ label: string; fait: boolean; detail: string }[]> {
    const seriesDuJour = await seriesRepository.parDate(date);
    const totalSets = seriesDuJour.reduce((sum, s) => sum + s.sets, 0);
    return [
      {
        label: "Séance",
        fait: totalSets > 0,
        detail: totalSets > 0 ? `${totalSets} séries loggées` : "Pas encore de séance aujourd'hui",
      },
    ];
  }
}
