export const dynamic = "force-dynamic";
import { objectifsRepository, tracesRepository } from "@/lib/adapters/repositories";
import { objectifDepuisRow } from "@/lib/domain/mappers";
import { todayISO } from "@/lib/domain/services";
import {
  coherenceParObjectif,
  alerteObjectif,
  indiceProductivite,
  semaineDe,
} from "@/lib/domain/coherence";
import ObjectifsClient from "@/components/ObjectifsClient";

export default async function ObjectifsPage() {
  const today = todayISO();
  const semaine = semaineDe(today);

  const [rows, traces] = await Promise.all([
    objectifsRepository.all(),
    tracesRepository.entreDates(semaine[0], semaine[6]),
  ]);

  // La cohérence se recalcule à chaque lecture. Rien n'est stocké : corriger
  // une journée passée doit corriger le score, pas le laisser faux.
  const coherences = coherenceParObjectif(
    rows.map((r) => ({ id: r.id, joursParSemaine: r.joursParSemaine })),
    traces,
    semaine
  );

  // Polymorphisme : chaque instance (ObjectifTemps/ObjectifMetrique) sait
  // calculer sa propre progression, pas de branchement manuel ici.
  const objectifs = rows.map((row) => {
    const instance = objectifDepuisRow(row);
    const c = coherences.get(row.id)!;
    return {
      id: row.id,
      nom: row.nom,
      type: row.type as "temps" | "metrique",
      deadline: row.deadline,
      heuresCible: row.heuresCible,
      minutesInvesties: row.minutesInvesties,
      rawUnite: row.unite,
      valeurCible: row.valeurCible,
      valeurActuelle: row.valeurActuelle,
      progression: instance.calculerProgression(),
      unite: instance.describeUnite(),
      joursParSemaine: row.joursParSemaine,
      coherence: c.pourcentage,
      joursFaits: c.joursFaits,
      joursTravailles: c.dates,
      alerte: alerteObjectif(c, today),
    };
  });

  const moyenne =
    objectifs.length > 0
      ? Math.round(objectifs.reduce((s, o) => s + o.progression, 0) / objectifs.length)
      : 0;

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Objectifs</h1>
          <p className="page-sub">
            {objectifs.length === 0
              ? "Rien à viser pour l'instant."
              : `${objectifs.length} objectif${objectifs.length > 1 ? "s" : ""} suivi${objectifs.length > 1 ? "s" : ""} · ${moyenne}% de progression moyenne.`}
          </p>
        </div>
      </header>

      <ObjectifsClient
        initialObjectifs={objectifs}
        indice={indiceProductivite(coherences.values())}
        semaine={semaine}
        today={today}
      />
    </>
  );
}
