// Aperçu du réordonnancement, sans base. Le composant est le vrai : ce qu'on
// juge ici part en production. Aucun lien n'y mène.
"use client";

import { useState } from "react";
import OrdreSeance from "@/components/OrdreSeance";
import SeanceReorganisable from "@/components/SeanceReorganisable";

const EXOS = [
  { id: "1", nom: "Développé couché barre", groupeMusculaire: "pectoraux" },
  { id: "2", nom: "Rowing barre", groupeMusculaire: "dos" },
  { id: "3", nom: "Développé militaire", groupeMusculaire: "epaules" },
  { id: "4", nom: "Tractions", groupeMusculaire: "dos" },
  { id: "5", nom: "Curl haltères", groupeMusculaire: "biceps" },
  { id: "6", nom: "Extension triceps à la poulie", groupeMusculaire: "triceps" },
];

export default function ApercuOrdre() {
  const [ouvert, setOuvert] = useState(true);

  return (
    <div className="p-5">
      <h1 className="font-heading mb-1 text-xl font-bold">Ordre des exercices</h1>
      <p className="mb-5 text-sm text-[var(--grey)]">
        Panneau ouvert en haut, bouton d&apos;entrée en bas.
      </p>

      {ouvert ? (
        <OrdreSeance exercices={EXOS} onFerme={() => setOuvert(false)} />
      ) : (
        <button className="seance-reorganiser" onClick={() => setOuvert(true)}>
          Rouvrir le panneau
        </button>
      )}

      <hr className="my-8 border-[var(--card-border)]" />

      <SeanceReorganisable exercices={EXOS}>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-card)] p-5 text-sm text-[var(--grey)]">
          Les cartes d&apos;exercice viendraient ici — elles restent rendues par le serveur et ne
          traversent pas la frontière client.
        </div>
      </SeanceReorganisable>
    </div>
  );
}
