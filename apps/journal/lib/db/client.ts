import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

function getConnectionString(): string {
  // En previsualisation, une variable qui echappe a l'integration Neon.
  //
  // Vercel gere DATABASE_URL via l'integration, sur "All Environments" : la
  // modifier a la main pour separer les environnements fonctionne jusqu'a la
  // prochaine synchronisation, qui la remet en silence. Une variable d'un autre
  // nom, invisible de l'integration, ne peut pas etre ecrasee.
  //
  // Elle n'est lue qu'en previsualisation, et seulement si elle est definie :
  // le jour ou l'integration creera une branche par deploiement, il suffira de
  // la retirer pour revenir au comportement natif.
  if (process.env.VERCEL_ENV === "preview" && process.env.DATABASE_URL_PREVIEW) {
    return process.env.DATABASE_URL_PREVIEW;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "Aucune variable de connexion Postgres trouvee (DATABASE_URL / POSTGRES_URL / POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING). " +
      "Verifie Vercel > Settings > Environment Variables du projet journal-productivity (base Neon dediee, distincte de Sport)."
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
