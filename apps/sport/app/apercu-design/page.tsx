// Route d'aperçu : rend les composants réels avec le CSS réel, sur un jeu de
// données figé, pour pouvoir juger le rendu sans base de données.
// Supprimable sans impact sur l'app.

import CarteMusculaireSection, { type GroupeVM } from "@/components/CarteMusculaireSection";

const GROUPES: GroupeVM[] = [
  { groupe: "pectoraux", sets: 16, derniereDate: "2026-10-14", exercices: [
    { id: "1", nom: "Développé couché barre" }, { id: "2", nom: "Développé incliné haltères" },
    { id: "3", nom: "Écarté poulie haute" } ] },
  { groupe: "epaules", sets: 11, derniereDate: "2026-10-14", exercices: [
    { id: "4", nom: "Développé militaire" }, { id: "5", nom: "Élévations latérales" } ] },
  { groupe: "triceps", sets: 9, derniereDate: "2026-10-13", exercices: [
    { id: "6", nom: "Dips lestés" }, { id: "7", nom: "Extension poulie corde" } ] },
  { groupe: "dos", sets: 6, derniereDate: "2026-10-11", exercices: [
    { id: "8", nom: "Tractions pronation" }, { id: "9", nom: "Rowing barre" } ] },
  { groupe: "jambes", sets: 5, derniereDate: "2026-10-10", exercices: [
    { id: "10", nom: "Squat barre" }, { id: "11", nom: "Presse inclinée" } ] },
  { groupe: "biceps", sets: 3, derniereDate: "2026-10-12", exercices: [
    { id: "12", nom: "Curl barre EZ" } ] },
  { groupe: "abdominaux", sets: 2, derniereDate: "2026-10-09", exercices: [
    { id: "13", nom: "Relevé de jambes suspendu" } ] },
  { groupe: "mollets", sets: 0, derniereDate: "2026-09-28", exercices: [
    { id: "14", nom: "Mollets debout" } ] },
  { groupe: "avant-bras", sets: 0, derniereDate: null, exercices: [] },
];

export default function Apercu() {
  return (
    <div>
      <section className="seance-bandeau">
        <div className="seance-infos">
          <p className="seance-jour">mardi</p>
          <h2 className="seance-nom">Push — Pectoraux / Épaules</h2>
          <p className="seance-meta">2 / 5 exercices · 7 séries</p>
        </div>
        <div className="seance-actions">
          <a href="#" className="seance-cta">Reprendre</a>
        </div>
      </section>

      <CarteMusculaireSection groupes={GROUPES} today="2026-10-14" />
    </div>
  );
}
