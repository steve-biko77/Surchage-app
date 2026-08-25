import { config } from "dotenv";
config({ path: ".env.local" }); // charge d'abord .env.local (celui utilise par Next.js)
config();                        // puis .env comme repli, sans ecraser ce qui est deja charge
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL manquant. Verifie que .env.local (a la racine de apps/journal) contient bien DATABASE_URL=... (base Neon journal-productivity, distincte de Sport)"
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
