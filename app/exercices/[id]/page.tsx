export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { exercicesRepository, exercicesMusclesRepository } from "@/lib/adapters/repositories";
import MuscleSilhouette from "@/components/MuscleSilhouette";
import MuscleMapDetail from "@/components/MuscleMapDetail";
import { Badge } from "@/components/ui/badge";
import type { MuscleDetail, RoleMuscle } from "@/lib/domain/types";

const TYPES_CHARGE_LABELS: Record<string, string> = {
  haltere: "Haltère",
  poulie: "Poulie",
  barre: "Barre",
  poids_du_corps: "Poids du corps",
};

export default async function FicheExercicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercice = await exercicesRepository.parId(id);
  if (!exercice) notFound();

  const muscles = await exercicesMusclesRepository.parExercice(id);

  return (
    <div>
      <Link href="/entrainements" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#3B82C4]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour
      </Link>

      <div className="mb-4 flex items-start gap-3">
        <MuscleSilhouette groupe={exercice.groupeMusculaire} />
        <div>
          <h2 className="font-heading text-2xl font-bold leading-tight">{exercice.nom}</h2>
          <div className="mt-1.5 flex gap-1.5">
            <Badge className="capitalize">{exercice.groupeMusculaire}</Badge>
            <Badge variant="info">{TYPES_CHARGE_LABELS[exercice.typeCharge] ?? exercice.typeCharge}</Badge>
          </div>
        </div>
      </div>

      <MuscleMapDetail muscles={muscles.map((m) => ({ muscle: m.muscle as MuscleDetail, role: m.role as RoleMuscle }))} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-card)] p-3 text-center">
          <div className="font-heading text-lg font-black">{exercice.repPlancher}</div>
          <div className="text-[10px] uppercase text-[var(--grey)]">Reps plancher</div>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-card)] p-3 text-center">
          <div className="font-heading text-lg font-black">{exercice.repPlafond}</div>
          <div className="text-[10px] uppercase text-[var(--grey)]">Reps plafond</div>
        </div>
      </div>
    </div>
  );
}
