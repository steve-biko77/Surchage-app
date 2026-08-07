import { pgTable, text, real, integer, boolean, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";

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
  ordre: integer("ordre").notNull().default(0),
  repPlancher: integer("rep_plancher").notNull().default(8),
  repPlafond: integer("rep_plafond").notNull().default(12),
  typeCharge: text("type_charge").notNull().default("haltere"), // "haltere" | "poulie" | "barre" | "poids_du_corps"
  uniteMesure: text("unite_mesure").notNull().default("repetitions"), // "repetitions" | "duree"
  dureePlancherSec: integer("duree_plancher_sec"),
  dureePlafondSec: integer("duree_plafond_sec"),
});

export const objectifsExercices = pgTable(
  "objectifs_exercices",
  {
    objectifId: uuid("objectif_id").references(() => objectifs.id).notNull(),
    exerciceId: uuid("exercice_id").references(() => exercices.id).notNull(),
  },
  (table) => [primaryKey({ columns: [table.objectifId, table.exerciceId] })]
);

export const series = pgTable("series", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull(), // ISO date "2026-08-04"
  exerciceId: uuid("exercice_id").references(() => exercices.id).notNull(),
  poids: real("poids").notNull().default(0),
  reps: integer("reps").notNull(),
  sets: integer("sets").notNull(),
  dureeSecondes: integer("duree_secondes"), // rempli seulement si l'exercice a uniteMesure = "duree"
  note: text("note").default(""),
  source: text("source").notNull().default("manuel"), // "manuel" | "strava" | "boditrax" (Phase 4)
  createdAt: timestamp("created_at").defaultNow(),
});

export const objectifsDuJour = pgTable("objectifs_du_jour", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull(),
  texte: text("texte").notNull(),
});

export const exercicesMuscles = pgTable("exercices_muscles", {
  id: uuid("id").defaultRandom().primaryKey(),
  exerciceId: uuid("exercice_id").references(() => exercices.id).notNull(),
  muscle: text("muscle").notNull(),
  // valeurs possibles, referentiel ferme :
  // deltoide_anterieur, deltoide_lateral, deltoide_posterieur, trapeze,
  // grand_dorsal, pectoraux, biceps, triceps, avant_bras, abdominaux, obliques,
  // quadriceps, ischio_jambiers, fessiers, mollets
  role: text("role").notNull(), // "primaire" | "secondaire"
});

export const seancesPlanifiees = pgTable("seances_planifiees", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull(),
  nom: text("nom").notNull(),
  disciplineId: uuid("discipline_id").references(() => disciplines.id),
  exerciceIds: text("exercice_ids").notNull(), // JSON.stringify(string[]), ordre inclus
  statut: text("statut").notNull().default("planifiee"), // "planifiee" | "realisee"
  source: text("source").notNull().default("manuel"), // "manuel" | "ia" (Phase 4)
});
