// Point de branchement Journal <-> Jarvis (note d'architecture, §4).
// Meme contrat que SportModule (apps/sport/src/SportModule.ts).
import { JarvisModule, type Discipline, type Objectif } from "@productivity/core";
import { disciplinesRepository, joursValidesRepository, objectifsRepository, tachesRepository } from "../lib/adapters/repositories";
import { disciplineDepuisRow, objectifDepuisRow } from "../lib/domain/mappers";
import { calculerStreak, enumererDates, todayISO } from "../lib/domain/services";
import {
  profilsParSource,
  rythmeParJour,
  type CocheBrute,
  type ProfilDHeures,
} from "../lib/domain/engagement";

export interface RapportDiscipline {
  id: string;
  nom: string;
  icone: string;
  joursValides: number;
  streak: number;
}

export interface RapportObjectif {
  id: string;
  nom: string;
  unite: string;
  progression: number;
}

export interface RapportJourSerie {
  date: string;
  pourcentage: number;
  engage: boolean;
}

export interface RapportJournal {
  dateDebut: string;
  dateFin: string;
  pourcentageTachesFaites: number;
  disciplines: RapportDiscipline[];
  objectifs: RapportObjectif[];
  joursEngages: number;
  joursTotal: number;
  serieJournaliere: RapportJourSerie[];
}

export interface RapportRythme {
  enBloc: number;
  auFilDeLEau: number;
  indetermine: number;
  /** Moyenne des passages par journee concluante, ou null s'il n'y en a aucune. */
  sessionsMoyennes: number | null;
}

export interface RapportEngagement {
  /** Taches : la fenetre du rapport, car l'horodatage ne date que de PROD-7. */
  taches: ProfilDHeures;
  /** Disciplines : TOUT l'historique, car `created_at` existe depuis le debut. */
  disciplines: ProfilDHeures;
  /** Premiere journee reellement observee pour les disciplines, ou null. */
  disciplinesDepuis: string | null;
  rythme: RapportRythme;
  /** Coches qui n'ont pas pu etre comptees, et pourquoi. */
  ecartees: { sansHeure: number; horsJour: number };
}

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

  /**
   * Profil d'heures et rythme de coche, pour la page /rapport.
   *
   * Deux fenetres differentes, et c'est voulu : les taches ne sont horodatees
   * que depuis la mise en place de `fait_a`, tandis que les validations de
   * discipline le sont depuis le premier jour d'utilisation. Enfermer les
   * disciplines dans la fenetre du rapport jetterait un historique deja
   * disponible, au moment precis ou il devient lisible.
   *
   * Le rythme, lui, porte sur la seule fenetre : c'est une description de la
   * periode affichee, pas une moyenne de toute la vie du journal.
   */
  async getEngagement(dateDebut: string, dateFin: string): Promise<RapportEngagement> {
    const [tachesPeriode, validations] = await Promise.all([
      tachesRepository.entreDates(dateDebut, dateFin),
      joursValidesRepository.tous(),
    ]);

    // Seule une tache COCHEE est une coche. Une tache jamais faite n'a pas
    // d'heure parce qu'elle n'a pas eu lieu, ce qui n'a rien d'une donnee
    // manquante : la compter comme telle gonflerait le nombre d'ecartees.
    const cochesTaches: CocheBrute[] = tachesPeriode
      .filter((t) => t.fait)
      .map((t) => ({ jour: t.date, instant: t.faitA, source: "tache" as const }));

    const cochesDisciplines: CocheBrute[] = validations.map((v) => ({
      jour: v.date,
      instant: v.createdAt,
      source: "discipline" as const,
    }));

    const profils = profilsParSource([...cochesTaches, ...cochesDisciplines]);

    const dansLaFenetre = (c: CocheBrute) => c.jour >= dateDebut && c.jour <= dateFin;
    const { jours } = rythmeParJour([
      ...cochesTaches,
      ...cochesDisciplines.filter(dansLaFenetre),
    ]);

    const enBloc = jours.filter((j) => j.mode === "en-bloc").length;
    const auFilDeLEau = jours.filter((j) => j.mode === "au-fil-de-l-eau").length;
    const indetermine = jours.filter((j) => j.mode === "indetermine").length;
    const concluantes = jours.filter((j) => j.mode !== "indetermine");
    const sessionsMoyennes =
      concluantes.length > 0
        ? Math.round((concluantes.reduce((s, j) => s + j.sessions, 0) / concluantes.length) * 10) / 10
        : null;

    // La premiere journee REELLEMENT observee, qui n'est pas forcement la plus
    // ancienne date presente : un import en masse porte des dates anciennes
    // avec un horodatage recent, et son heure ne dit rien des habitudes.
    const joursObserves = rythmeParJour(cochesDisciplines).jours;
    const disciplinesDepuis = joursObserves.length > 0 ? joursObserves[0].jour : null;

    return {
      taches: profils.tache,
      disciplines: profils.discipline,
      disciplinesDepuis,
      rythme: { enBloc, auFilDeLEau, indetermine, sessionsMoyennes },
      ecartees: { sansHeure: profils.sansHeure, horsJour: profils.horsJour },
    };
  }

  /** Agrege les chiffres d'engagement sur [dateDebut, dateFin] pour la page /rapport. */
  async getRapport(dateDebut: string, dateFin: string): Promise<RapportJournal> {
    const [tachesPeriode, disciplinesRows, objectifsActifs] = await Promise.all([
      tachesRepository.entreDates(dateDebut, dateFin),
      disciplinesRepository.all(),
      this.getObjectifsActifs(),
    ]);

    const totalTaches = tachesPeriode.length;
    const tachesFaites = tachesPeriode.filter((t) => t.fait).length;
    const pourcentageTachesFaites = totalTaches > 0 ? Math.round((tachesFaites / totalTaches) * 100) : 0;

    const datesEngageesTaches = new Set(tachesPeriode.filter((t) => t.fait).map((t) => t.date));
    const datesEngageesDisciplines = new Set<string>();
    const today = todayISO();

    const disciplines: RapportDiscipline[] = await Promise.all(
      disciplinesRows.map(async (row) => {
        const [historiqueComplet, joursPeriode] = await Promise.all([
          joursValidesRepository.parDiscipline(row.id),
          joursValidesRepository.parDisciplineEntreDates(row.id, dateDebut, dateFin),
        ]);
        joursPeriode.forEach((j) => datesEngageesDisciplines.add(j.date));
        return {
          id: row.id,
          nom: row.nom,
          icone: row.icone,
          joursValides: joursPeriode.length,
          streak: calculerStreak(historiqueComplet.map((j) => j.date), today),
        };
      })
    );

    const objectifs: RapportObjectif[] = objectifsActifs.map((o) => ({
      id: o.id,
      nom: o.nom,
      unite: o.describeUnite(),
      progression: o.calculerProgression(),
    }));

    const toutesDates = enumererDates(dateDebut, dateFin);
    const joursEngages = toutesDates.filter(
      (d) => datesEngageesTaches.has(d) || datesEngageesDisciplines.has(d)
    ).length;

    // Serie journaliere pour le graphique du dashboard : % de taches cochees
    // ce jour-la (0 si aucune tache ce jour-la) + si le jour est "engage"
    // (taches ou disciplines), pour distinguer les deux couleurs du graphe.
    const tachesParDate = new Map<string, { total: number; faites: number }>();
    for (const t of tachesPeriode) {
      const entry = tachesParDate.get(t.date) ?? { total: 0, faites: 0 };
      entry.total += 1;
      if (t.fait) entry.faites += 1;
      tachesParDate.set(t.date, entry);
    }
    const serieJournaliere: RapportJourSerie[] = toutesDates.map((d) => {
      const jourTaches = tachesParDate.get(d);
      const pourcentage = jourTaches && jourTaches.total > 0 ? Math.round((jourTaches.faites / jourTaches.total) * 100) : 0;
      return {
        date: d,
        pourcentage,
        engage: datesEngageesTaches.has(d) || datesEngageesDisciplines.has(d),
      };
    });

    return {
      dateDebut,
      dateFin,
      pourcentageTachesFaites,
      disciplines,
      objectifs,
      joursEngages,
      joursTotal: toutesDates.length,
      serieJournaliere,
    };
  }
}
