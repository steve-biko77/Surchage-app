export const dynamic = "force-dynamic";
import { tachesRecurrentesRepository } from "@/lib/adapters/repositories";
import RecurrentesClient from "@/components/RecurrentesClient";

export default async function RecurrentesPage() {
  const rows = await tachesRecurrentesRepository.all();
  const modeles = rows.map((row) => ({
    ...row,
    frequence: row.frequence as "journaliere" | "hebdomadaire",
  }));
  return <RecurrentesClient initialModeles={modeles} />;
}
