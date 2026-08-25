export const dynamic = "force-dynamic";

import { exercicesRepository, programmesRepository } from "@/lib/adapters/repositories";
import EntrainementsClient from "@/components/EntrainementsClient";

export default async function EntrainementsPage() {
  const [exercices, programmes] = await Promise.all([
    exercicesRepository.all(),
    programmesRepository.all(),
  ]);

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-4">Entraînements</h2>
      <EntrainementsClient exercices={exercices} programmes={programmes} />
    </div>
  );
}
