import { pgTable, text, real, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

// Schema de persistance du module Journal (adapter Postgres, base Neon distincte de Sport).

export const disciplinesInstances = pgTable("disciplines_instances", {
  id: uuid("id").defaultRandom().primaryKey(),
  nom: text("nom").notNull(),
  icone: text("icone").notNull(),
  couleur: text("couleur").notNull(),
  type: text("type").notNull().default("checkin"), // "checkin" | "sport"
});

export const joursValides = pgTable("jours_valides", {
  id: uuid("id").defaultRandom().primaryKey(),
  disciplineId: uuid("discipline_id").references(() => disciplinesInstances.id).notNull(),
  date: text("date").notNull(), // ISO date "2026-08-25"
  note: text("note"), // "Un mot sur cette session ?" -- optionnel
  createdAt: timestamp("created_at").defaultNow(),
});

export const objectifs = pgTable("objectifs", {
  id: uuid("id").defaultRandom().primaryKey(),
  nom: text("nom").notNull(),
  type: text("type").notNull().default("temps"), // "temps" | "performance"
  disciplineId: uuid("discipline_id").references(() => disciplinesInstances.id),
  deadline: text("deadline"), // ISO date string, nullable
  heuresCible: real("heures_cible"),
  minutesInvesties: integer("minutes_investies").notNull().default(0),
  poidsCible: real("poids_cible"),
  meilleurPoidsAtteint: real("meilleur_poids_atteint"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taches = pgTable("taches", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull(),
  texte: text("texte").notNull(),
  heure: text("heure"), // "HH:mm", nullable (tache sans heure fixe = checklist)
  fait: boolean("fait").notNull().default(false),
  objectifId: uuid("objectif_id").references(() => objectifs.id),
});

export const notesJour = pgTable("notes_jour", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull().unique(), // une seule note par jour, upsert par date
  texte: text("texte").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/** Etat global du nudge adaptatif (une seule ligne, app mono-utilisateur). */
export const nudgeState = pgTable("nudge_state", {
  id: uuid("id").defaultRandom().primaryKey(),
  lastNotifiedAt: timestamp("last_notified_at"),
  lastMessage: text("last_message"),
  lastActionAt: timestamp("last_action_at"),
});
