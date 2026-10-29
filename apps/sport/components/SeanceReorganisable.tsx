"use client";

// Enveloppe la liste d'exercices d'une séance et lui ajoute un mode
// « réorganiser ».
//
// Les cartes elles-mêmes restent rendues par le serveur et passent en
// `children` : basculer en mode ordre ne les démonte pas, et rien de ce
// qu'elles contiennent — séries saisies, panneau ouvert — n'a besoin de
// traverser la frontière client.

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import OrdreSeance, { type ExerciceOrdonnable } from "./OrdreSeance";

export default function SeanceReorganisable({
  exercices,
  children,
}: {
  exercices: ExerciceOrdonnable[];
  children: React.ReactNode;
}) {
  const [ordre, setOrdre] = useState(false);

  // Sous deux exercices, il n'y a rien à réordonner.
  if (exercices.length < 2) return <>{children}</>;

  return (
    <>
      {ordre ? (
        <OrdreSeance exercices={exercices} onFerme={() => setOrdre(false)} />
      ) : (
        <>
          <div className="seance-outils">
            <button type="button" className="seance-reorganiser" onClick={() => setOrdre(true)}>
              <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
              Réorganiser
            </button>
          </div>
          {children}
        </>
      )}
    </>
  );
}
