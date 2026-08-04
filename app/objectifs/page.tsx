export const dynamic = "force-dynamic";

import { objectifsRepository } from "@/lib/adapters/repositories";
import ObjectifsClient from "@/components/ObjectifsClient";

export default async function ObjectifsPage() {
  const objectifs = await objectifsRepository.all();
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Objectifs</h2>
      <ObjectifsClient initialObjectifs={objectifs} />
    </div>
  );
}
