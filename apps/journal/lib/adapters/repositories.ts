// Adapters de sortie - implementent la persistance Journal (Drizzle + Postgres, base dediee).
import { db } from "../db/client";
import { disciplinesInstances, joursValides, objectifs, taches } from "../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const disciplinesRepository = {
  async all() {
    return db.select().from(disciplinesInstances);
  },
  async parId(id: string) {
    const [row] = await db.select().from(disciplinesInstances).where(eq(disciplinesInstances.id, id));
    return row ?? null;
  },
};

export const joursValidesRepository = {
  async parDiscipline(disciplineId: string) {
    return db.select().from(joursValides).where(eq(joursValides.disciplineId, disciplineId));
  },
  async parDisciplineEntreDates(disciplineId: string, dateDebut: string, dateFin: string) {
    return db
      .select()
      .from(joursValides)
      .where(
        and(
          eq(joursValides.disciplineId, disciplineId),
          gte(joursValides.date, dateDebut),
          lte(joursValides.date, dateFin)
        )
      );
  },
  async estValide(disciplineId: string, date: string) {
    const [row] = await db
      .select()
      .from(joursValides)
      .where(and(eq(joursValides.disciplineId, disciplineId), eq(joursValides.date, date)));
    return row ?? null;
  },
  /** Bascule la validation d'une discipline pour une date donnee. */
  async toggle(disciplineId: string, date: string) {
    const existant = await joursValidesRepository.estValide(disciplineId, date);
    if (existant) {
      await db.delete(joursValides).where(eq(joursValides.id, existant.id));
      return false;
    }
    await db.insert(joursValides).values({ disciplineId, date });
    return true;
  },
};

export const objectifsRepository = {
  async all() {
    return db.select().from(objectifs);
  },
  async parId(id: string) {
    const [row] = await db.select().from(objectifs).where(eq(objectifs.id, id));
    return row ?? null;
  },
  async create(input: {
    nom: string;
    type: "temps" | "performance";
    disciplineId: string | null;
    deadline?: string | null;
    heuresCible?: number | null;
    poidsCible?: number | null;
  }) {
    const [row] = await db.insert(objectifs).values(input).returning();
    return row;
  },
  async ajouterMinutes(id: string, minutes: number) {
    const existant = await objectifsRepository.parId(id);
    if (!existant) throw new Error("Objectif introuvable");
    const [row] = await db
      .update(objectifs)
      .set({ minutesInvesties: existant.minutesInvesties + minutes })
      .where(eq(objectifs.id, id))
      .returning();
    return row;
  },
  async setMeilleurPoidsAtteint(id: string, poids: number) {
    const [row] = await db.update(objectifs).set({ meilleurPoidsAtteint: poids }).where(eq(objectifs.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(objectifs).where(eq(objectifs.id, id));
  },
};

export const tachesRepository = {
  async parDate(date: string) {
    return db.select().from(taches).where(eq(taches.date, date));
  },
  async create(input: { date: string; texte: string; heure?: string | null; objectifId?: string | null }) {
    const [row] = await db.insert(taches).values(input).returning();
    return row;
  },
  async toggleFait(id: string) {
    const [existant] = await db.select().from(taches).where(eq(taches.id, id));
    if (!existant) throw new Error("Tache introuvable");
    const [row] = await db.update(taches).set({ fait: !existant.fait }).where(eq(taches.id, id)).returning();
    return row;
  },
  async delete(id: string) {
    await db.delete(taches).where(eq(taches.id, id));
  },
};
