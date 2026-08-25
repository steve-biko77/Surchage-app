export const dynamic = "force-dynamic";

import { exercicesRepository } from "@/lib/adapters/repositories";
import ProgressionClient from "@/components/ProgressionClient";

export default async function ProgressionPage() {
  const exercices = await exercicesRepository.all();
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-4">Progression par exercice</h2>
      <ProgressionClient exercices={exercices.map((e) => ({ id: e.id, nom: e.nom }))} />
    </div>
  );
}
