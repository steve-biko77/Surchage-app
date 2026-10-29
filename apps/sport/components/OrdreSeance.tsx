"use client";

// Réorganisation des exercices de la séance du jour.
//
// La liste passe en mode compact pendant le réordonnancement : une ligne par
// exercice, poignée à gauche. Faire glisser les vraies cartes serait
// impraticable — elles font trois cents pixels de haut et contiennent un
// formulaire de saisie qu'on toucherait par erreur à chaque prise.
//
// Deux façons de déplacer, délibérément : le glisser pour qui est à l'aise,
// les flèches pour le reste. Au doigt, sur un écran de téléphone, pendant une
// séance et les mains moites, la flèche ne rate jamais sa cible.

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, GripVertical, Check, X, Loader2 } from "lucide-react";
import MuscleSilhouette from "./MuscleSilhouette";

export type ExerciceOrdonnable = {
  id: string;
  nom: string;
  groupeMusculaire: string;
};

function deplacer<T>(liste: T[], de: number, vers: number): T[] {
  if (de === vers || vers < 0 || vers >= liste.length) return liste;
  const copie = [...liste];
  const [item] = copie.splice(de, 1);
  copie.splice(vers, 0, item);
  return copie;
}

export default function OrdreSeance({
  exercices,
  onFerme,
}: {
  exercices: ExerciceOrdonnable[];
  onFerme: () => void;
}) {
  const router = useRouter();
  const [ordre, setOrdre] = useState<ExerciceOrdonnable[]>(exercices);
  const [saisi, setSaisi] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const listeRef = useRef<HTMLUListElement>(null);

  const initial = exercices.map((e) => e.id).join();
  const modifie = ordre.map((e) => e.id).join() !== initial;

  const bouger = useCallback((index: number, delta: number) => {
    setOrdre((o) => deplacer(o, index, index + delta));
  }, []);

  // Glisser : on travaille à l'index, pas aux coordonnées. À chaque survol
  // d'une autre ligne on permute, la liste se réarrange sous le doigt et
  // l'aperçu EST le résultat — pas besoin d'un fantôme à positionner.
  function debutGlisse(e: React.PointerEvent, id: string) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSaisi(id);
  }

  function glisse(e: React.PointerEvent) {
    if (!saisi || !listeRef.current) return;
    const lignes = [...listeRef.current.querySelectorAll<HTMLLIElement>("li[data-id]")];
    const sous = lignes.find((l) => {
      const r = l.getBoundingClientRect();
      return e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (!sous) return;
    const cible = lignes.indexOf(sous);
    const source = ordre.findIndex((x) => x.id === saisi);
    if (cible !== -1 && source !== -1 && cible !== source) {
      setOrdre((o) => deplacer(o, source, cible));
    }
  }

  const finGlisse = useCallback(() => setSaisi(null), []);

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await fetch("/api/seance-du-jour/ordre", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciceIds: ordre.map((e) => e.id) }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErreur(j.error ?? `Le serveur a refusé l'ordre (HTTP ${r.status}).`);
        return;
      }
      router.refresh();
      onFerme();
    } catch {
      setErreur("Impossible de joindre le serveur.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="ordre">
      <div className="ordre-tete">
        <div>
          <h3>Ordre des exercices</h3>
          <p>Glisse une ligne, ou utilise les flèches.</p>
        </div>
        <button type="button" className="ordre-fermer" onClick={onFerme} aria-label="Quitter la réorganisation">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="ordre-liste" ref={listeRef} onPointerMove={glisse} onPointerUp={finGlisse} onPointerCancel={finGlisse}>
        {ordre.map((exo, i) => (
          <li key={exo.id} data-id={exo.id} className={`ordre-ligne${saisi === exo.id ? " saisi" : ""}`}>
            <span
              className="ordre-poignee"
              onPointerDown={(e) => debutGlisse(e, exo.id)}
              role="button"
              tabIndex={-1}
              aria-hidden="true"
            >
              <GripVertical className="h-4 w-4" />
            </span>

            <span className="ordre-rang">{i + 1}</span>
            <MuscleSilhouette groupe={exo.groupeMusculaire} nom={exo.nom} compact />

            <span className="ordre-nom">
              {exo.nom}
              <small>{exo.groupeMusculaire}</small>
            </span>

            <span className="ordre-fleches">
              <button
                type="button"
                onClick={() => bouger(i, -1)}
                disabled={i === 0}
                aria-label={`Monter ${exo.nom}`}
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => bouger(i, 1)}
                disabled={i === ordre.length - 1}
                aria-label={`Descendre ${exo.nom}`}
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </span>
          </li>
        ))}
      </ul>

      {erreur && <p className="ordre-erreur">{erreur}</p>}

      <div className="ordre-pied">
        <button type="button" className="ordre-valider" onClick={enregistrer} disabled={!modifie || envoi}>
          {envoi ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          {envoi ? "Enregistrement…" : modifie ? "Enregistrer l'ordre" : "Aucun changement"}
        </button>
      </div>
    </div>
  );
}
