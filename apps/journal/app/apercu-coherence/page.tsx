// Aperçu de la cohérence hebdomadaire, sans base. Les calculs passent par les
// VRAIES fonctions du domaine : ce qu'on juge ici est ce qui tournera en
// production, et les cas limites (rythme absent, objectif négligé, semaine
// pleine) sont visibles côte à côte. Aucun lien n'y mène.
import {
  coherenceParObjectif,
  alerteObjectif,
  indiceProductivite,
  semaineDe,
} from "@/lib/domain/coherence";
import ObjectifsClient from "@/components/ObjectifsClient";

// Jeudi : assez de semaine écoulée pour que « négligé » ait un sens.
const TODAY = "2026-10-22";

const BRUTS = [
  { id: "a", nom: "Terminer le module Sport", joursParSemaine: 4, heuresCible: 60, minutesInvesties: 1850 },
  { id: "b", nom: "Lire 30 minutes par jour", joursParSemaine: 7, heuresCible: 40, minutesInvesties: 900 },
  { id: "c", nom: "Prospection clients", joursParSemaine: 2, heuresCible: 25, minutesInvesties: 120 },
  { id: "d", nom: "Apprendre le piano", joursParSemaine: null, heuresCible: 50, minutesInvesties: 300 },
];

// a : 3 jours sur 4 · b : 4 jours sur 7 · c : rien (négligé) · d : sans rythme
const TRACES = [
  { objectifId: "a", date: "2026-10-19" },
  { objectifId: "a", date: "2026-10-20" },
  { objectifId: "a", date: "2026-10-20" }, // doublon : un jour ne compte qu'une fois
  { objectifId: "a", date: "2026-10-22" },
  { objectifId: "b", date: "2026-10-19" },
  { objectifId: "b", date: "2026-10-20" },
  { objectifId: "b", date: "2026-10-21" },
  { objectifId: "b", date: "2026-10-22" },
  { objectifId: "d", date: "2026-10-21" },
];

export default function ApercuCoherence() {
  const semaine = semaineDe(TODAY);
  const coherences = coherenceParObjectif(
    BRUTS.map((o) => ({ id: o.id, joursParSemaine: o.joursParSemaine })),
    TRACES,
    semaine
  );

  const objectifs = BRUTS.map((o) => {
    const c = coherences.get(o.id)!;
    return {
      id: o.id,
      nom: o.nom,
      type: "temps" as const,
      deadline: null,
      heuresCible: o.heuresCible,
      minutesInvesties: o.minutesInvesties,
      rawUnite: null,
      valeurCible: null,
      valeurActuelle: null,
      progression: Math.min(100, Math.round((o.minutesInvesties / 60 / o.heuresCible) * 100)),
      unite: `${Math.round(o.minutesInvesties / 60)} h sur ${o.heuresCible} h`,
      joursParSemaine: o.joursParSemaine,
      coherence: c.pourcentage,
      joursFaits: c.joursFaits,
      joursTravailles: c.dates,
      alerte: alerteObjectif(c, TODAY),
    };
  });

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Cohérence hebdomadaire</h1>
          <p className="page-sub">
            Semaine du {semaine[0]} au {semaine[6]}, vue un jeudi. Quatre cas : rythme presque
            tenu, rythme intenable, objectif négligé, objectif sans rythme.
          </p>
        </div>
      </header>
      <ObjectifsClient
        initialObjectifs={objectifs}
        indice={indiceProductivite(coherences.values())}
        semaine={semaine}
        today={TODAY}
      />
    </>
  );
}
