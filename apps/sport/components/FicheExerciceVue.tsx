// Corps de la fiche d'exercice, sans accès base : la vraie page et la route
// d'aperçu rendent ce même composant, donc ce qu'on juge en aperçu est bien
// ce qui part en production.

import { Crosshair, ListChecks, TriangleAlert } from "lucide-react";
import MuscleMapDetail from "./MuscleMapDetail";
import type { FicheExercice } from "@/lib/domain/referentielExercices";
import type { MuscleDetail, RoleMuscle } from "@/lib/domain/types";

export type FicheExerciceVueProps = {
  groupeMusculaire: string;
  primaires: MuscleDetail[];
  secondaires: MuscleDetail[];
  fiche: FicheExercice | null;
  cibles: { haut: string; basGauche: string; basDroite: string } | null;
};

export default function FicheExerciceVue({
  groupeMusculaire,
  primaires,
  secondaires,
  fiche,
  cibles,
}: FicheExerciceVueProps) {
  const pourCarte = [
    ...primaires.map((m) => ({ muscle: m, role: "primaire" as RoleMuscle })),
    ...secondaires.map((m) => ({ muscle: m, role: "secondaire" as RoleMuscle })),
  ];

  return (
    <div className="fiche-grille">
      <div className="fiche-carte">
        <MuscleMapDetail muscles={pourCarte} />
      </div>

      <div className="fiche-texte">
        {fiche ? (
          <>
            <p className="fiche-desc">{fiche.description}</p>

            <div className="fiche-focus">
              <Crosshair className="h-4 w-4 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
              <div>
                <span className="fiche-k">Focus</span>
                <p>{fiche.focus}</p>
              </div>
            </div>

            <section className="fiche-bloc">
              <h3 className="fiche-h3">
                <ListChecks className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
                Exécution
              </h3>
              <ol className="fiche-consignes">
                {fiche.consignes.map((c, i) => (
                  <li key={i}>
                    <span className="fiche-num">{i + 1}</span>
                    {c}
                  </li>
                ))}
              </ol>
            </section>

            <section className="fiche-bloc">
              <h3 className="fiche-h3">
                <TriangleAlert className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                Erreurs fréquentes
              </h3>
              <ul className="fiche-erreurs">
                {fiche.erreurs.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <p className="fiche-desc">
            Pas encore de fiche détaillée pour cet exercice. La carte s&apos;appuie sur son groupe
            musculaire&nbsp;: <b className="capitalize">{groupeMusculaire}</b>.
          </p>
        )}

        {cibles && (
          <div className="fiche-cibles">
            <div>
              <b>{cibles.basGauche}</b>
              <span>{cibles.haut === "duree" ? "Durée plancher" : "Reps plancher"}</span>
            </div>
            <div>
              <b>{cibles.basDroite}</b>
              <span>{cibles.haut === "duree" ? "Durée plafond" : "Reps plafond"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
