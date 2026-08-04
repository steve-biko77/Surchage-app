import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Adapter de sortie (StoragePort implementation) - chapitre V, 5.2 / 5.4
// En V1, on utilise directement le pool pg + drizzle. DATABASE_URL est fourni
// par l'integration Vercel Postgres (ou tout Postgres compatible) en production,
// et par une base Postgres locale/Docker en developpement.

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
