// Route d'apercu des widgets d'accueil : rendu avec des donnees figees, sans
// base. Elle sert a juger le dessin dans le vrai build (polices, cascade CSS
// reelles) la ou /jour exige une connexion Neon. Aucun lien ne pointe dessus.
import WidgetAccueil from "@/components/WidgetAccueil";

const SEMAINE = (faits: number[], aujourdhui: number) =>
  ["L", "M", "M", "J", "V", "S", "D"].map((lettre, i) => ({
    date: `2026-10-${String(19 + i).padStart(2, "0")}`,
    lettre,
    validee: faits.includes(i),
    estAujourdhui: i === aujourdhui,
    futur: i > aujourdhui,
  }));

const DISCIPLINES = [
  { id: "d1", nom: "Sport", icone: "🏋️", couleur: "#1d7fe0" },
  { id: "d2", nom: "Lecture", icone: "📖", couleur: "#6d6ff0" },
  { id: "d3", nom: "Code", icone: "💻", couleur: "#0ea98f" },
];

const TACHES = [
  { id: "t1", texte: "Ajouter des recommandations de charge sur Surcharge", heure: null, fait: false },
  { id: "t2", texte: "Faire un chatbot pour le support client", heure: null, fait: false },
  { id: "t3", texte: "Joby pepper", heure: "18:30", fait: false },
  { id: "t4", texte: "Relire le dossier", heure: null, fait: true },
];

export default function ApercuWidget() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
      <section>
        <h2 className="page-title" style={{ fontSize: 17, marginBottom: 10 }}>
          Série installée — rien de validé aujourd&apos;hui
        </h2>
        <WidgetAccueil
          date="2026-10-25"
          heure={9}
          streak={12}
          semaine={SEMAINE([0, 1, 2, 3, 4, 5], 6)}
          disciplines={DISCIPLINES.map((d) => ({ ...d, faite: false }))}
          taches={TACHES}
          noteInitiale=""
        />
      </section>

      <section>
        <h2 className="page-title" style={{ fontSize: 17, marginBottom: 10 }}>
          Série ancrée — journée bien engagée
        </h2>
        <WidgetAccueil
          date="2026-10-25"
          heure={21}
          streak={322}
          semaine={SEMAINE([0, 1, 2, 3, 4, 5, 6], 6)}
          disciplines={DISCIPLINES.map((d, i) => ({ ...d, faite: i < 2 }))}
          taches={TACHES.map((t, i) => ({ ...t, fait: i !== 1 }))}
          noteInitiale="Séance courte mais propre. Le dos a tenu."
        />
      </section>

      <section>
        <h2 className="page-title" style={{ fontSize: 17, marginBottom: 10 }}>
          Aucune série — rien de posé
        </h2>
        <WidgetAccueil
          date="2026-10-25"
          heure={15}
          streak={0}
          semaine={SEMAINE([], 6)}
          disciplines={DISCIPLINES.map((d) => ({ ...d, faite: false }))}
          taches={[]}
          noteInitiale=""
        />
      </section>
    </div>
  );
}
