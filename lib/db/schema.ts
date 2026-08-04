import { pgTable, text, real, integer, boolean, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";

// --- Coeur de domaine : schema de persistance (adapter Postgres) ---
// Chaque table correspond a une entite du diagramme de classes (chapitre IV, Figure 1)

export const disciplines = pgTable("disciplines", {
  id: uuid("id").defaultRandom().primaryKey(),
  nom: text("nom").notNull(),
  couleur: text("couleur").notNull().default("#FF5A1F"),
});

export const objectifs = pgTable("objectifs", {
  id: uuid("id").defaultRandom().primaryKey(),
  nom: text("nom").notNull(),
  disciplineId: uuid("discipline_id").references(() => disciplines.id),
  heuresCible: real("heures_cible").notNull(),
  minutesInvesties: integer("minutes_investies").notNull().default(0),
  deadline: text("deadline"), // ISO date string, nullable
  createdAt: timestamp("created_at").defaultNow(),
  type: text("type").notNull().default("temps"), // "temps" | "performance"
  exerciceId: uuid("exercice_id").references((): AnyPgColumn => exercices.id),
  poidsCible: real("poids_cible"),
});

export const programmes = pgTable("programmes", {
  id: uuid("id").defaultRandom().primaryKey(),
  nom: text("nom").notNull(), // ex: "Bras", "Jambes", "Basket"
  jourSemaine: text("jour_semaine").notNull(), // "lundi".."dimanche"
  disciplineId: uuid("discipline_id").references(() => disciplines.id),
});

export const exercices = pgTable("exercices", {
  id: uuid("id").defaultRandom().primaryKey(),
  nom: text("nom").notNull(),
  programmeId: uuid("programme_id").references(() => programmes.id),
  groupeMusculaire: text("groupe_musculaire").notNull(), // dos, biceps, triceps, epaules, pectoraux, jambes, avant-bras, abdominaux, mollets
  prioritaire: boolean("prioritaire").notNull().default(false),
  objectifId: uuid("objectif_id").references(() => objectifs.id),
  ordre: integer("ordre").notNull().default(0),
  incrementKg: real("increment_kg").notNull().default(2),
  repPlancher: integer("rep_plancher").notNull().default(8),
  repPlafond: integer("rep_plafond").notNull().default(12),
});

export const series = pgTable("series", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull(), // ISO date "2026-08-04"
  exerciceId: uuid("exercice_id").references(() => exercices.id).notNull(),
  poids: real("poids").notNull().default(0),
  reps: integer("reps").notNull(),
  sets: integer("sets").notNull(),
  note: text("note").default(""),
  source: text("source").notNull().default("manuel"), // "manuel" | "strava" | "boditrax" (Phase 4)
  createdAt: timestamp("created_at").defaultNow(),
});

export const objectifsDuJour = pgTable("objectifs_du_jour", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull(),
  texte: text("texte").notNull(),
});
