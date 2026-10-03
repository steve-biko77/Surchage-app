export const dynamic = "force-dynamic";
import { tachesRecurrentesRepository } from "@/lib/adapters/repositories";
import RecurrentesClient from "@/components/RecurrentesClient";

export default async function RecurrentesPage() {
  const rows = await tachesRecurrentesRepository.all();
  const modeles = rows.map((row) => ({
    ...row,
    frequence: row.frequence as "journaliere" | "hebdomadaire",
  }));

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Récurrentes</h1>
          <p className="page-sub">
            Les modèles actifs déposent automatiquement leur tâche sur la journée concernée, sans intervention.
          </p>
        </div>
      </header>

      <RecurrentesClient initialModeles={modeles} />
    </>
  );
}
