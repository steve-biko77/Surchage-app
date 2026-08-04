// Adapters de sortie (secondary/driven) - implementent les ports de persistance
// en s'appuyant sur Drizzle + Postgres. Chapitre V, 5.2.

import { db } from "../db/client";
import { disciplines, objectifs, programmes, exercices, series, objectifsDuJour } from "../db/schema";
import { eq } from "drizzle-orm";
import type { JourSemaine } from "../domain/types";

export const disciplinesRepository = {
  async all() {
    return db.select().from(disciplines);
  },
  async create(nom: string, couleur: string) {
    const [row] = await db.insert(disciplines).values({ nom, couleur }).returning();
    return row;
  },
};

export const programmesRepository = {
  async all() {
    return db.select().from(programmes);
  },
  async parJour(jourSemaine: JourSemaine) {
    return db.select().from(programmes).where(eq(programmes.jourSemaine, jourSemaine));
  },
  async create(nom: string, jourSemaine: JourSemaine, disciplineId: string | null) {
    const [row] = await db.insert(programmes).values({ nom, jourSemaine, disciplineId }).returning();
    return row;
  },
  async changerJour(id: string, jourSemaine: JourSemaine) {
    const [row] = await db.update(programmes).set({ jourSemaine }).where(eq(programmes.id, id)).returning();
    return row;
  },
  /** Inverse le jourSemaine de deux programmes (demande explicite du cahier des charges) */
  async inverser(idA: string, idB: string) {
    const [a] = await db.select().from(programmes).where(eq(programmes.id, idA));
    const [b] = await db.select().from(programmes).where(eq(programmes.id, idB));
    if (!a || !b) throw new Error("Programme introuvable");
    await db.update(programmes).set({ jourSemaine: b.jourSemaine }).where(eq(programmes.id, a.id));
    await db.update(programmes).set({ jourSemaine: a.jourSemaine }).where(eq(programmes.id, b.id));
  },
};

export const exercicesRepository = {
  async parProgramme(programmeId: string) {
    return db.select().from(exercices).where(eq(exercices.programmeId, programmeId)).orderBy(exercices.ordre);
  },
  async all() {
    return db.select().from(exercices);
  },
  async create(input: {
    nom: string; programmeId: string; groupeMusculaire: string; prioritaire?: boolean; objectifId?: string | null; ordre?: number;
  }) {
    const [row] = await db.insert(exercices).values(input).returning();
    return row;
  },
  async togglePrioritaire(id: string, prioritaire: boolean, objectifId: string | null) {
    const [row] = await db.update(exercices).set({ prioritaire, objectifId }).where(eq(exercices.id, id)).returning();
    return row;
  },
};

export const seriesRepository = {
  async parExercice(exerciceId: string) {
    return db.select().from(series).where(eq(series.exerciceId, exerciceId));
  },
  async parDate(date: string) {
    return db.select().from(series).where(eq(series.date, date));
  },
  async all() {
    return db.select().from(series);
  },
  async create(input: { date: string; exerciceId: string; poids: number; reps: number; sets: number; note?: string }) {
    const [row] = await db.insert(series).values(input).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(series).where(eq(series.id, id));
  },
};

export const objectifsRepository = {
  async all() {
    return db.select().from(objectifs);
  },
  async create(input: {
    nom: string;
    disciplineId: string | null;
    heuresCible: number;
    deadline?: string | null;
    type?: "temps" | "performance";
    exerciceId?: string | null;
    poidsCible?: number | null;
  }) {
    const [row] = await db.insert(objectifs).values(input).returning();
    return row;
  },
  async ajouterMinutes(id: string, minutes: number) {
    const [existant] = await db.select().from(objectifs).where(eq(objectifs.id, id));
    if (!existant) throw new Error("Objectif introuvable");
    const [row] = await db
      .update(objectifs)
      .set({ minutesInvesties: existant.minutesInvesties + minutes })
      .where(eq(objectifs.id, id))
      .returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(objectifs).where(eq(objectifs.id, id));
  },
};

export const objectifsDuJourRepository = {
  async parDate(date: string) {
    const rows = await db.select().from(objectifsDuJour).where(eq(objectifsDuJour.date, date));
    return rows[0] ?? null;
  },
  async set(date: string, texte: string) {
    const existant = await objectifsDuJourRepository.parDate(date);
    if (existant) {
      const [row] = await db.update(objectifsDuJour).set({ texte }).where(eq(objectifsDuJour.id, existant.id)).returning();
      return row;
    }
    const [row] = await db.insert(objectifsDuJour).values({ date, texte }).returning();
    return row;
  },
};
