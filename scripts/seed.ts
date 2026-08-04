import { config } from "dotenv";
config({ path: ".env.local" });
config();

// Script de seed : cree les disciplines/programmes/exercices de reference
// et importe l'historique reel deja collecte (14, 19, 22 juillet).
// Usage : npx tsx scripts/seed.ts   (necessite DATABASE_URL dans .env)

import { db } from "../lib/db/client";
import { disciplines, programmes, exercices, series } from "../lib/db/schema";

async function main() {
  console.log("Seed en cours...");

  const [sport] = await db.insert(disciplines).values({ nom: "Sport", couleur: "#D64545" }).returning();

  const [progBras] = await db.insert(programmes).values({ nom: "Bras", jourSemaine: "mardi", disciplineId: sport.id }).returning();
  const [progDos] = await db.insert(programmes).values({ nom: "Dos / Épaules", jourSemaine: "lundi", disciplineId: sport.id }).returning();
  const [progJambes] = await db.insert(programmes).values({ nom: "Jambes", jourSemaine: "jeudi", disciplineId: sport.id }).returning();
  const [progBasket] = await db.insert(programmes).values({ nom: "Basket", jourSemaine: "mercredi", disciplineId: sport.id }).returning();

  const exosData: Array<{ nom: string; programmeId: string; groupeMusculaire: string; ordre: number }> = [
    { nom: "Tirage vertical", programmeId: progDos.id, groupeMusculaire: "dos", ordre: 0 },
    { nom: "Rowing assis à la poulie", programmeId: progDos.id, groupeMusculaire: "dos", ordre: 1 },
    { nom: "Développer épaule machine", programmeId: progDos.id, groupeMusculaire: "epaules", ordre: 2 },
    { nom: "Tractions", programmeId: progDos.id, groupeMusculaire: "dos", ordre: 3 },
    { nom: "Développer coucher haltères", programmeId: progDos.id, groupeMusculaire: "pectoraux", ordre: 4 },
    { nom: "Pompes", programmeId: progDos.id, groupeMusculaire: "pectoraux", ordre: 5 },
    { nom: "Dip", programmeId: progDos.id, groupeMusculaire: "triceps", ordre: 6 },

    { nom: "Curl biceps", programmeId: progBras.id, groupeMusculaire: "biceps", ordre: 0 },
    { nom: "Curl marteau", programmeId: progBras.id, groupeMusculaire: "biceps", ordre: 1 },
    { nom: "Extension triceps poulie", programmeId: progBras.id, groupeMusculaire: "triceps", ordre: 2 },
    { nom: "Avant-bras haltères", programmeId: progBras.id, groupeMusculaire: "avant-bras", ordre: 3 },
    { nom: "Circuit avant-bras", programmeId: progBras.id, groupeMusculaire: "avant-bras", ordre: 4 },
    { nom: "Curl biceps machine", programmeId: progBras.id, groupeMusculaire: "biceps", ordre: 5 },
    { nom: "Développer latérale", programmeId: progBras.id, groupeMusculaire: "epaules", ordre: 6 },

    { nom: "Squat", programmeId: progJambes.id, groupeMusculaire: "jambes", ordre: 0 },
    { nom: "Presse à cuisses", programmeId: progJambes.id, groupeMusculaire: "jambes", ordre: 1 },
    { nom: "Mollets debout", programmeId: progJambes.id, groupeMusculaire: "mollets", ordre: 2 },
  ];

  const exoRows: Record<string, string> = {};
  for (const e of exosData) {
    const [row] = await db.insert(exercices).values(e).returning();
    exoRows[e.nom] = row.id;
  }

  const seriesData: Array<[string, string, number, number, number, string]> = [
    ["2026-07-14", "Tirage vertical", 50, 10, 3, ""],
    ["2026-07-14", "Tractions", 0, 10, 3, ""],
    ["2026-07-14", "Développer épaule machine", 20, 7, 3, ""],
    ["2026-07-14", "Pompes", 0, 10, 2, ""],
    ["2026-07-14", "Développer coucher haltères", 5, 10, 3, ""],
    ["2026-07-14", "Avant-bras haltères", 6, 10, 2, ""],
    ["2026-07-14", "Curl biceps", 10, 7, 2, ""],
    ["2026-07-14", "Extension triceps poulie", 12.5, 10, 4, ""],
    ["2026-07-19", "Tirage vertical", 50, 10, 3, ""],
    ["2026-07-19", "Curl biceps", 12, 10, 3, "1 série échouée à 5 reps"],
    ["2026-07-19", "Curl marteau", 12, 10, 1, ""],
    ["2026-07-19", "Extension triceps poulie", 12.5, 12, 3, ""],
    ["2026-07-22", "Tirage vertical", 45, 10, 3, ""],
    ["2026-07-22", "Développer épaule machine", 20, 7, 3, ""],
    ["2026-07-22", "Curl biceps", 8, 10, 3, ""],
    ["2026-07-22", "Avant-bras haltères", 8, 10, 2, ""],
    ["2026-07-22", "Curl biceps machine", 20, 7, 2, ""],
    ["2026-07-22", "Développer latérale", 6, 8, 2, ""],
  ];

  for (const [date, nom, poids, reps, sets, note] of seriesData) {
    const exerciceId = exoRows[nom];
    if (!exerciceId) continue;
    await db.insert(series).values({ date, exerciceId, poids, reps, sets, note });
  }

  console.log("Seed terminé : 1 discipline, 4 programmes, " + exosData.length + " exercices, " + seriesData.length + " séries.");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
