// Adapters de sortie (secondary/driven) - implementent les ports de persistance
// en s'appuyant sur Drizzle + Postgres. Chapitre V, 5.2.

import { db } from "../db/client";
import {
  disciplines, objectifs, programmes, exercices, series, objectifsDuJour,
  objectifsExercices, seancesPlanifiees, exercicesMuscles,
} from "../db/schema";
import { eq, inArray, and, gte, lte } from "drizzle-orm";
import type { JourSemaine, StatutSeancePlanifiee, MuscleDetail, RoleMuscle } from "../domain/types";

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
  async parIds(ids: string[]) {
    if (ids.length === 0) return [];
    return db.select().from(exercices).where(inArray(exercices.id, ids));
  },
  async parId(id: string) {
    const [row] = await db.select().from(exercices).where(eq(exercices.id, id));
    return row ?? null;
  },
  async all() {
    return db.select().from(exercices);
  },
  async create(input: {
    nom: string;
    programmeId: string | null;
    groupeMusculaire: string;
    prioritaire?: boolean;
    ordre?: number;
    typeCharge?: string;
    repPlancher?: number;
    repPlafond?: number;
  }) {
    const [row] = await db.insert(exercices).values(input).returning();
    return row;
  },
  async togglePrioritaire(id: string, prioritaire: boolean) {
    const [row] = await db.update(exercices).set({ prioritaire }).where(eq(exercices.id, id)).returning();
    return row;
  },
};

export const seriesRepository = {
  async parExercice(exerciceId: string) {
    return db.select().from(series).where(eq(series.exerciceId, exerciceId));
  },
  async parExercices(exerciceIds: string[]) {
    if (exerciceIds.length === 0) return [];
    return db.select().from(series).where(inArray(series.exerciceId, exerciceIds));
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
  async parId(id: string) {
    const [row] = await db.select().from(objectifs).where(eq(objectifs.id, id));
    return row ?? null;
  },
  async create(input: {
    nom: string;
    disciplineId: string | null;
    heuresCible: number;
    deadline?: string | null;
    type?: "temps" | "performance";
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

/** Relation plusieurs-a-plusieurs "priorise" entre objectifs et exercices */
export const objectifsExercicesRepository = {
  async all() {
    return db.select().from(objectifsExercices);
  },
  async parObjectif(objectifId: string) {
    return db.select().from(objectifsExercices).where(eq(objectifsExercices.objectifId, objectifId));
  },
  async parExercice(exerciceId: string) {
    return db.select().from(objectifsExercices).where(eq(objectifsExercices.exerciceId, exerciceId));
  },
  /** Remplace l'integralite des exercices lies a un objectif */
  async setLiens(objectifId: string, exerciceIds: string[]) {
    await db.delete(objectifsExercices).where(eq(objectifsExercices.objectifId, objectifId));
    if (exerciceIds.length === 0) return;
    await db.insert(objectifsExercices).values(exerciceIds.map((exerciceId) => ({ objectifId, exerciceId })));
  },
};

/** Detail des muscles primaires/secondaires travailles par exercice (fiche exercice) */
export const exercicesMusclesRepository = {
  async all() {
    return db.select().from(exercicesMuscles);
  },
  async parExercice(exerciceId: string) {
    return db.select().from(exercicesMuscles).where(eq(exercicesMuscles.exerciceId, exerciceId));
  },
  /** Remplace l'integralite du detail musculaire d'un exercice */
  async setPourExercice(exerciceId: string, muscles: Array<{ muscle: MuscleDetail; role: RoleMuscle }>) {
    await db.delete(exercicesMuscles).where(eq(exercicesMuscles.exerciceId, exerciceId));
    if (muscles.length === 0) return;
    await db.insert(exercicesMuscles).values(muscles.map((m) => ({ exerciceId, muscle: m.muscle, role: m.role })));
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

function serializeExerciceIds(ids: string[]) {
  return JSON.stringify(ids);
}
function deserializeExerciceIds(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const seancesPlanifieesRepository = {
  async parDate(date: string) {
    const rows = await db.select().from(seancesPlanifiees).where(eq(seancesPlanifiees.date, date));
    return rows.map((r) => ({ ...r, exerciceIds: deserializeExerciceIds(r.exerciceIds) }));
  },
  async entreDates(dateDebut: string, dateFin: string) {
    const rows = await db
      .select()
      .from(seancesPlanifiees)
      .where(and(gte(seancesPlanifiees.date, dateDebut), lte(seancesPlanifiees.date, dateFin)));
    return rows.map((r) => ({ ...r, exerciceIds: deserializeExerciceIds(r.exerciceIds) }));
  },
  async create(input: {
    date: string;
    nom: string;
    disciplineId?: string | null;
    exerciceIds: string[];
    source?: string;
  }) {
    const [row] = await db
      .insert(seancesPlanifiees)
      .values({ ...input, exerciceIds: serializeExerciceIds(input.exerciceIds) })
      .returning();
    return { ...row, exerciceIds: deserializeExerciceIds(row.exerciceIds) };
  },
  async setStatut(id: string, statut: StatutSeancePlanifiee) {
    const [row] = await db.update(seancesPlanifiees).set({ statut }).where(eq(seancesPlanifiees.id, id)).returning();
    return row ? { ...row, exerciceIds: deserializeExerciceIds(row.exerciceIds) } : null;
  },
  async delete(id: string) {
    await db.delete(seancesPlanifiees).where(eq(seancesPlanifiees.id, id));
  },
};
