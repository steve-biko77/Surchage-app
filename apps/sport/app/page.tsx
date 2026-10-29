export const dynamic = "force-dynamic";

import Link from "next/link";
import { Target, CalendarClock, Play, RotateCcw } from "lucide-react";
import { seriesRepository, objectifsDuJourRepository } from "@/lib/adapters/repositories";
import { resoudreSeanceDuJour } from "@/lib/adapters/seanceDuJour";
import { calculerNiveauFlamme, calculerResumeSeance, todayISO } from "@/lib/domain/services";
import type { GroupeMusculaire } from "@/lib/domain/types";
import { GROUPE_LABELS } from "@/lib/domain/anatomie";
import ExerciseCard from "@/components/ExerciseCard";
import SeanceReorganisable from "@/components/SeanceReorganisable";
import FlameBadge from "@/components/FlameBadge";
import CarteMusculaireSection, { type GroupeVM } from "@/components/CarteMusculaireSection";
import SeanceResumeWidget from "@/components/SeanceResumeWidget";
import CarrouselModeles from "@/components/CarrouselModeles";

const TOUS_GROUPES = Object.keys(GROUPE_LABELS) as GroupeMusculaire[];

export default async function SeanceDuJourPage() {
  const { jour, today, nomSeance, estPlanifiee, exercicesAvecCible, tousExercices } =
    await resoudreSeanceDuJour();

  const [toutesSeries, objectifDuJour] = await Promise.all([
    seriesRepository.all(),
    objectifsDuJourRepository.parDate(today),
  ]);

  const exoParId = new Map(tousExercices.map((e) => [e.id, e]));
  const groupeParExercice = Object.fromEntries(tousExercices.map((e) => [e.id, e.groupeMusculaire]));

  const septJoursAvant = new Date();
  septJoursAvant.setDate(septJoursAvant.getDate() - 6);
  const seuil = todayISO(septJoursAvant);

  // Volume 7 jours + dernière sollicitation, par groupe : les deux chiffres que
  // la carte musculaire et son panneau de détail affichent.
  const volumeParGroupe: Record<string, number> = {};
  const dernierePar: Record<string, string> = {};
  for (const s of toutesSeries) {
    const exo = exoParId.get(s.exerciceId);
    if (!exo) continue;
    const g = exo.groupeMusculaire;
    if (s.date >= seuil && s.date <= today) {
      volumeParGroupe[g] = (volumeParGroupe[g] ?? 0) + s.sets;
    }
    if (!dernierePar[g] || s.date > dernierePar[g]) dernierePar[g] = s.date;
  }

  const exercicesParGroupe: Record<string, Array<{ id: string; nom: string }>> = {};
  for (const e of tousExercices) {
    (exercicesParGroupe[e.groupeMusculaire] ??= []).push({ id: e.id, nom: e.nom });
  }

  const groupesVM: GroupeVM[] = TOUS_GROUPES.map((g) => ({
    groupe: g,
    sets: volumeParGroupe[g] ?? 0,
    exercices: (exercicesParGroupe[g] ?? []).slice(0, 6),
    derniereDate: dernierePar[g] ?? null,
  }));

  const seriesAujourdhui = toutesSeries.filter((s) => s.date === today);
  const resume = calculerResumeSeance(seriesAujourdhui, groupeParExercice);

  const totalSets = exercicesAvecCible.flatMap((e) => e.seriesAujourdhui).reduce((s, x) => s + x.sets, 0);
  const niveauFlamme = calculerNiveauFlamme(totalSets);
  const nbCompletes = exercicesAvecCible.filter((e) => e.seriesAujourdhui.length > 0).length;
  const commencee = nbCompletes > 0;

  return (
    <div>
      {/* ---- Action de séance : lisible d'un coup d'œil, sans voler la vedette ---- */}
      {nomSeance ? (
        <section className="seance-bandeau">
          <div className="seance-infos">
            <p className="seance-jour">
              {jour}
              {estPlanifiee && (
                <span className="seance-tag">
                  <CalendarClock className="h-3 w-3" aria-hidden="true" /> planifiée
                </span>
              )}
            </p>
            <h2 className="seance-nom">{nomSeance}</h2>
            {exercicesAvecCible.length > 0 && (
              <p className="seance-meta">
                {nbCompletes} / {exercicesAvecCible.length} exercices · {totalSets} séries
              </p>
            )}
          </div>

          <div className="seance-actions">
            <FlameBadge niveau={niveauFlamme} />
            {exercicesAvecCible.length > 0 && (
              <Link href="/entrainement-en-cours" className="seance-cta">
                {commencee ? (
                  <><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reprendre</>
                ) : (
                  <><Play className="h-4 w-4" aria-hidden="true" /> Démarrer</>
                )}
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section className="seance-bandeau">
          <div className="seance-infos">
            <p className="seance-jour">{jour}</p>
            <h2 className="seance-nom">Aucun programme</h2>
            <p className="seance-meta">Configure ton split pour voir la séance du jour apparaître ici.</p>
          </div>
        </section>
      )}

      {/* ---- Élément principal de l'app ---- */}
      <CarteMusculaireSection groupes={groupesVM} today={today} />

      {objectifDuJour && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border-l-2 border-[var(--accent)] bg-gradient-to-r from-[var(--accent-wash)] to-transparent px-3 py-2.5 text-sm text-[var(--chalk)]">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
          <span><b>Objectif du jour :</b> {objectifDuJour.texte}</span>
        </div>
      )}

      {resume.nbSeries > 0 && (
        <div className="mb-4">
          <SeanceResumeWidget resume={resume} />
        </div>
      )}

      {!nomSeance || !estPlanifiee ? <CarrouselModeles exercices={tousExercices} /> : null}

      {exercicesAvecCible.length > 0 && (
        <SeanceReorganisable
          exercices={exercicesAvecCible.map((e) => ({
            id: e.id,
            nom: e.nom,
            groupeMusculaire: e.groupeMusculaire,
          }))}
        >
          <div className="exos-grille">
            {exercicesAvecCible.map((exo) => (
              <ExerciseCard key={exo.id} exercice={exo} />
            ))}
          </div>
        </SeanceReorganisable>
      )}
    </div>
  );
}
