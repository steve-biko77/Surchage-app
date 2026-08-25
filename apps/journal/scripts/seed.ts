import { config } from "dotenv";
config({ path: ".env.local" });
config();

// Seed : prepeuple les 5 disciplines Journal (toutes en simple check-in journalier,
// y compris "Sport" qui ne duplique pas le module apps/sport -- voir note d'architecture).
import { db } from "../lib/db/client";
import { disciplinesInstances } from "../lib/db/schema";

const DISCIPLINES = [
  { nom: "Duolingo", icone: "🦉", couleur: "#2FB673", type: "checkin" as const },
  { nom: "Échecs", icone: "♟️", couleur: "#1E6FB8", type: "checkin" as const },
  { nom: "Sport", icone: "🏋️", couleur: "#2C8FE0", type: "checkin" as const },
  { nom: "Discipline", icone: "🎯", couleur: "#FFB020", type: "checkin" as const },
  { nom: "Trading", icone: "📈", couleur: "#1E6FB8", type: "checkin" as const },
];

async function main() {
  const existantes = await db.select().from(disciplinesInstances);
  if (existantes.length > 0) {
    console.log(`${existantes.length} discipline(s) deja presente(s), seed ignore.`);
    return;
  }
  await db.insert(disciplinesInstances).values(DISCIPLINES);
  console.log(`${DISCIPLINES.length} disciplines creees.`);
}

main().then(() => process.exit(0));
