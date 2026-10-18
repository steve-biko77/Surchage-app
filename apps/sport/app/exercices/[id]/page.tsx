export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { exercicesRepository, exercicesMusclesRepository } from "@/lib/adapters/repositories";
import { ficheParNom, musclesExercice } from "@/lib/domain/referentielExercices";
import FicheExerciceVue from "@/components/FicheExerciceVue";
import { Badge } from "@/components/ui/badge";
import type { GroupeMusculaire, MuscleDetail, RoleMuscle } from "@/lib/domain/types";

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

  // La base fait autorité si elle est renseignée (surcharge manuelle) ; sinon
  // le référentiel ; sinon le groupe musculaire, pour que la carte ne reste
  // jamais éteinte.
  const surcharge = await exercicesMusclesRepository.parExercice(id);
  const muscles = musclesExercice(
    exercice.nom,
    exercice.groupeMusculaire as GroupeMusculaire,
    surcharge.map((m) => ({ muscle: m.muscle as MuscleDetail, role: m.role as RoleMuscle }))
  );
  const fiche = ficheParNom(exercice.nom);

  const enDuree = exercice.uniteMesure === "duree";
  const cibles =
    enDuree
      ? exercice.dureePlancherSec != null && exercice.dureePlafondSec != null
        ? { haut: "duree", basGauche: `${exercice.dureePlancherSec}s`, basDroite: `${exercice.dureePlafondSec}s` }
        : null
      : { haut: "reps", basGauche: String(exercice.repPlancher), basDroite: String(exercice.repPlafond) };

  return (
    <div>
      <Link href="/entrainements" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--info)]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour
      </Link>

      <header className="mb-5">
        <h2 className="font-heading text-3xl font-bold leading-tight">{exercice.nom}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge className="capitalize">{exercice.groupeMusculaire}</Badge>
          <Badge variant="info">{TYPES_CHARGE_LABELS[exercice.typeCharge] ?? exercice.typeCharge}</Badge>
          {fiche && fiche.nom !== exercice.nom && <Badge variant="info">Fiche&nbsp;: {fiche.nom}</Badge>}
        </div>
      </header>

      <FicheExerciceVue
        groupeMusculaire={exercice.groupeMusculaire}
        primaires={muscles.primaires}
        secondaires={muscles.secondaires}
        fiche={fiche}
        cibles={cibles}
      />
    </div>
  );
}
