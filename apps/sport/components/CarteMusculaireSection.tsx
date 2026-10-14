"use client";

// Pièce maîtresse de l'accueil : la carte musculaire, la liste des groupes et
// le panneau de détail se pilotent mutuellement — survoler une ligne allume le
// muscle, cliquer un muscle ouvre son détail.

import { useMemo, useState } from "react";
import { Flame, History, Dumbbell } from "lucide-react";
import AnatomyMap from "./AnatomyMap";
import {
  GROUPE_LABELS,
  GROUPE_VERS_REGIONS,
  LIBELLES_NIVEAU,
  REGION_LABELS,
  intensitesParRegion,
  niveauDepuisSets,
  type NiveauVolume,
} from "@/lib/domain/anatomie";
import type { GroupeMusculaire } from "@/lib/domain/types";

export type GroupeVM = {
  groupe: GroupeMusculaire;
  sets: number;
  exercices: Array<{ id: string; nom: string }>;
  derniereDate: string | null;
};

function depuis(dateISO: string | null, today: string): string {
  if (!dateISO) return "jamais travaillé";
  const j = Math.round(
    (new Date(today + "T00:00:00").getTime() - new Date(dateISO + "T00:00:00").getTime()) / 86400000
  );
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return "hier";
  return `il y a ${j} jours`;
}

export default function CarteMusculaireSection({
  groupes,
  today,
}: {
  groupes: GroupeVM[];
  today: string;
}) {
  const [selection, setSelection] = useState<GroupeMusculaire | null>(null);
  const [survol, setSurvol] = useState<GroupeMusculaire | null>(null);

  const volumeParGroupe = useMemo(
    () => Object.fromEntries(groupes.map((g) => [g.groupe, g.sets])),
    [groupes]
  );
  const intensites = useMemo(() => intensitesParRegion(volumeParGroupe), [volumeParGroupe]);

  const totalSets = groupes.reduce((s, g) => s + g.sets, 0);
  const tries = useMemo(() => [...groupes].sort((a, b) => b.sets - a.sets), [groupes]);
  const detail = selection ? groupes.find((g) => g.groupe === selection) ?? null : null;

  // Le groupe le plus en retard : l'information qui déclenche une action.
  const neglige = useMemo(() => {
    const jamais = tries.filter((g) => g.sets === 0);
    if (jamais.length > 0) return jamais[jamais.length - 1];
    return tries[tries.length - 1] ?? null;
  }, [tries]);

  return (
    <section className="carte-sec">
      <header className="carte-sec-tete">
        <div>
          <h2 className="carte-sec-titre">Carte musculaire</h2>
          <p className="carte-sec-sous">
            {totalSets === 0
              ? "Aucune série sur 7 jours — la carte s'allume dès ta première séance."
              : `${totalSets} séries sur 7 jours, réparties sur ${tries.filter((g) => g.sets > 0).length} groupes.`}
          </p>
        </div>
        <div className="anat-legende">
          <span>Volume</span>
          <span className="barres" aria-hidden="true">
            {([0, 1, 2, 3, 4] as NiveauVolume[]).map((n) => (
              <i key={n} style={{ background: `var(--anat-${n})` }} />
            ))}
          </span>
        </div>
      </header>

      <div className="carte-grille">
        <div className="carte-corps">
          <AnatomyMap
            intensites={intensites}
            groupeActif={survol ?? selection}
            onSelectGroupe={(g) => setSelection((prec) => (prec === g ? null : g))}
          />
        </div>

        <div className="carte-liste">
          <ul className="grp-liste">
            {tries.map((g) => {
              const niveau = niveauDepuisSets(g.sets);
              const actif = (survol ?? selection) === g.groupe;
              return (
                <li key={g.groupe}>
                  <button
                    type="button"
                    className={`grp-ligne${actif ? " on" : ""}`}
                    onMouseEnter={() => setSurvol(g.groupe)}
                    onMouseLeave={() => setSurvol(null)}
                    onFocus={() => setSurvol(g.groupe)}
                    onBlur={() => setSurvol(null)}
                    onClick={() => setSelection((prec) => (prec === g.groupe ? null : g.groupe))}
                    aria-pressed={selection === g.groupe}
                  >
                    <span className="grp-nom">{GROUPE_LABELS[g.groupe]}</span>
                    <span className="grp-jauge" aria-hidden="true">
                      <i style={{ width: `${Math.min(100, (g.sets / 16) * 100)}%`, background: `var(--anat-${niveau})` }} />
                    </span>
                    <span className="grp-sets">{g.sets}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="carte-detail">
          {detail ? (
            <div className="grp-detail" key={detail.groupe}>
              <div className="grp-detail-tete">
                <h3>{GROUPE_LABELS[detail.groupe]}</h3>
                <button type="button" onClick={() => setSelection(null)} aria-label="Fermer le détail">
                  ✕
                </button>
              </div>

              <div className="grp-chips">
                <span className="chip">
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  {detail.sets} séries · {LIBELLES_NIVEAU[niveauDepuisSets(detail.sets)]}
                </span>
                <span className="chip">
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  {depuis(detail.derniereDate, today)}
                </span>
              </div>

              <div className="grp-portions">
                <span className="grp-k">Portions couvertes</span>
                <div className="grp-portions-liste">
                  {GROUPE_VERS_REGIONS[detail.groupe].map((r) => (
                    <span key={r} className="portion">{REGION_LABELS[r]}</span>
                  ))}
                </div>
              </div>

              {detail.exercices.length > 0 && (
                <div className="grp-exos">
                  <span className="grp-k">Exercices du programme</span>
                  <ul>
                    {detail.exercices.map((e) => (
                      <li key={e.id}>
                        <Dumbbell className="h-3.5 w-3.5 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
                        {e.nom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="grp-vide">
              {neglige && neglige.sets === 0 ? (
                <p>
                  <b>{GROUPE_LABELS[neglige.groupe]}</b> n&apos;a rien reçu cette semaine.
                </p>
              ) : neglige ? (
                <p>
                  Groupe le moins servi : <b>{GROUPE_LABELS[neglige.groupe]}</b>, {neglige.sets} séries.
                </p>
              ) : null}
              <p className="grp-vide-aide">Clique un muscle pour voir son détail.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
