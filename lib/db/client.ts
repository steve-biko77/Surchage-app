import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

function getConnectionString(): string {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "Aucune variable de connexion Postgres trouvee (DATABASE_URL / POSTGRES_URL / POSTGRES_PRISMA_URL). " +
      "Verifie Vercel > Settings > Environment Variables."
    );
  }
  return connectionString;
}

// Lazy singleton : la connexion n'est creee qu'au premier vrai appel,
// jamais au chargement du module (evite de casser le build Next.js).
function getDb() {
  if (!_db) {
    const pool = new Pool({
      connectionString: getConnectionString(),
      ssl: { rejectUnauthorized: false },
    });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});