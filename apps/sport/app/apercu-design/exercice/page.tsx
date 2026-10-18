// Aperçu de la fiche d'exercice, sans base de données.
// Rend le même composant que la vraie page, sur une entrée réelle du référentiel.

import { ficheParNom, musclesExercice } from "@/lib/domain/referentielExercices";
import FicheExerciceVue from "@/components/FicheExerciceVue";
import { Badge } from "@/components/ui/badge";

const NOM = "Tractions";
const GROUPE = "dos" as const;

export default function ApercuFiche() {
  const fiche = ficheParNom(NOM);
  const muscles = musclesExercice(NOM, GROUPE);

  return (
    <div>
      <header className="mb-5">
        <h2 className="font-heading text-3xl font-bold leading-tight">{NOM}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge className="capitalize">{GROUPE}</Badge>
          <Badge variant="info">Poids du corps</Badge>
        </div>
      </header>

      <FicheExerciceVue
        groupeMusculaire={GROUPE}
        primaires={muscles.primaires}
        secondaires={muscles.secondaires}
        fiche={fiche}
        cibles={{ haut: "reps", basGauche: "6", basDroite: "12" }}
      />
    </div>
  );
}
