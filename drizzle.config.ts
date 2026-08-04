import { config } from "dotenv";
config({ path: ".env.local" }); // charge d'abord .env.local (celui utilise par Next.js)
config();                        // puis .env comme repli, sans ecraser ce qui est deja charge
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL manquant. Verifie que .env.local (a la racine du projet, a cote de package.json) contient bien DATABASE_URL=..."
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
