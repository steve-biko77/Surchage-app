// Point de branchement Journal <-> Jarvis (note d'architecture, §4).
// Meme contrat que SportModule (apps/sport/src/SportModule.ts).
import { JarvisModule, type Discipline, type Objectif } from "@productivity/core";
import { disciplinesRepository, joursValidesRepository, objectifsRepository } from "../lib/adapters/repositories";
import { disciplineDepuisRow, objectifDepuisRow } from "../lib/domain/mappers";

export class JournalModule extends JarvisModule {
  readonly id = "journal";
  readonly nom = "Journal";
  readonly icone = "📓";

  async getDisciplines(): Promise<Discipline[]> {
    const rows = await disciplinesRepository.all();
    return rows.map(disciplineDepuisRow);
  }

  async getObjectifsActifs(): Promise<Objectif[]> {
    const rows = await objectifsRepository.all();
    return rows.map(objectifDepuisRow);
  }

  async onDailyTick(_date: string): Promise<void> {
    // Rien de special pour l'instant : pas de decroissance automatique de flamme prevue.
  }

  async getResumeDuJour(date: string): Promise<{ label: string; fait: boolean; detail: string }[]> {
    const disciplines = await disciplinesRepository.all();
    return Promise.all(
      disciplines.map(async (d) => {
        const valide = await joursValidesRepository.estValide(d.id, date);
        return {
          label: d.nom,
          fait: valide !== null,
          detail: valide !== null ? "Fait aujourd'hui" : "Pas encore fait aujourd'hui",
        };
      })
    );
  }
}
