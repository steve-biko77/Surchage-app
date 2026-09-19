// Adapters de sortie - implementent la persistance Journal (Drizzle + Postgres, base dediee).
import { db } from "../db/client";
import {
  disciplinesInstances,
  joursValides,
  objectifs,
  taches,
  notesJour,
  pushSubscriptions,
  nudgeState,
} from "../db/schema";
import { eq, and, gte, lte, desc, isNotNull } from "drizzle-orm";

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
  /** Vrai si au moins une discipline (n'importe laquelle) a ete validee a cette date. */
  async uneValidationLe(date: string) {
    const [row] = await db.select().from(joursValides).where(eq(joursValides.date, date));
    return !!row;
  },
  async estValide(disciplineId: string, date: string) {
    const [row] = await db
      .select()
      .from(joursValides)
      .where(and(eq(joursValides.disciplineId, disciplineId), eq(joursValides.date, date)));
    return row ?? null;
  },
  /** Bascule la validation d'une discipline pour une date donnee (note optionnelle a la validation). */
  async toggle(disciplineId: string, date: string, note?: string | null) {
    const existant = await joursValidesRepository.estValide(disciplineId, date);
    if (existant) {
      await db.delete(joursValides).where(eq(joursValides.id, existant.id));
      return false;
    }
    await db.insert(joursValides).values({ disciplineId, date, note: note || null });
    await nudgeStateRepository.enregistrerAction();
    return true;
  },
  /** Toutes les validations avec note, tous jours confondus (pour la page /journal). */
  async avecNotes() {
    return db
      .select({ id: joursValides.id, date: joursValides.date, note: joursValides.note, disciplineId: joursValides.disciplineId })
      .from(joursValides)
      .where(isNotNull(joursValides.note))
      .orderBy(desc(joursValides.date));
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
  async entreDates(dateDebut: string, dateFin: string) {
    return db.select().from(taches).where(and(gte(taches.date, dateDebut), lte(taches.date, dateFin)));
  },
  async create(input: { date: string; texte: string; heure?: string | null; objectifId?: string | null }) {
    const [row] = await db.insert(taches).values(input).returning();
    return row;
  },
  async toggleFait(id: string) {
    const [existant] = await db.select().from(taches).where(eq(taches.id, id));
    if (!existant) throw new Error("Tache introuvable");
    const [row] = await db.update(taches).set({ fait: !existant.fait }).where(eq(taches.id, id)).returning();
    if (row.fait) await nudgeStateRepository.enregistrerAction();
    return row;
  },
  async delete(id: string) {
    await db.delete(taches).where(eq(taches.id, id));
  },
};

export const notesJourRepository = {
  async parDate(date: string) {
    const [row] = await db.select().from(notesJour).where(eq(notesJour.date, date));
    return row ?? null;
  },
  /** Une seule note par jour : cree ou remplace le texte existant. */
  async upsert(date: string, texte: string) {
    const existant = await notesJourRepository.parDate(date);
    if (existant) {
      const [row] = await db
        .update(notesJour)
        .set({ texte, updatedAt: new Date() })
        .where(eq(notesJour.id, existant.id))
        .returning();
      return row;
    }
    const [row] = await db.insert(notesJour).values({ date, texte }).returning();
    return row;
  },
  async toutes() {
    return db.select().from(notesJour).orderBy(desc(notesJour.date));
  },
};

export const pushSubscriptionsRepository = {
  async all() {
    return db.select().from(pushSubscriptions);
  },
  async enregistrer(input: { endpoint: string; p256dh: string; auth: string }) {
    const [existante] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, input.endpoint));
    if (existante) return existante;
    const [row] = await db.insert(pushSubscriptions).values(input).returning();
    return row;
  },
  async supprimer(endpoint: string) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  },
};

export const nudgeStateRepository = {
  async get() {
    const [row] = await db.select().from(nudgeState);
    return row ?? null;
  },
  /** Cree la ligne unique d'etat au premier acces. */
  async getOuCreer() {
    const existant = await nudgeStateRepository.get();
    if (existant) return existant;
    const [row] = await db.insert(nudgeState).values({}).returning();
    return row;
  },
  /** Marque le moment d'une action d'engagement (tache cochee / discipline validee). */
  async enregistrerAction() {
    const etat = await nudgeStateRepository.getOuCreer();
    await db.update(nudgeState).set({ lastActionAt: new Date() }).where(eq(nudgeState.id, etat.id));
  },
  async enregistrerNotification(message: string) {
    const etat = await nudgeStateRepository.getOuCreer();
    await db
      .update(nudgeState)
      .set({ lastNotifiedAt: new Date(), lastMessage: message })
      .where(eq(nudgeState.id, etat.id));
  },
};
