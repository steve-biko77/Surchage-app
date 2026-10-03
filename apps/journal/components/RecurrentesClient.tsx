"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

type Frequence = "journaliere" | "hebdomadaire";

type TacheRecurrente = {
  id: string;
  texte: string;
  frequence: Frequence;
  joursSemaine: number[];
  heure: string | null;
  objectifId: string | null;
  actif: boolean;
};

const JOURS = [
  { valeur: 1, label: "L" },
  { valeur: 2, label: "M" },
  { valeur: 3, label: "M" },
  { valeur: 4, label: "J" },
  { valeur: 5, label: "V" },
  { valeur: 6, label: "S" },
  { valeur: 7, label: "D" },
];

function describeFrequence(m: TacheRecurrente): string {
  if (m.frequence === "journaliere") return "Tous les jours";
  const labels = m.joursSemaine
    .slice()
    .sort((a, b) => a - b)
    .map((j) => JOURS.find((jr) => jr.valeur === j)?.label ?? j);
  return `Chaque ${labels.join(", ")}`;
}

export default function RecurrentesClient({ initialModeles }: { initialModeles: TacheRecurrente[] }) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [frequence, setFrequence] = useState<Frequence>("journaliere");
  const [joursSemaine, setJoursSemaine] = useState<number[]>([]);
  const [heure, setHeure] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleJour(j: number) {
    setJoursSemaine((prev) => (prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]));
  }

  async function creer() {
    if (!texte) {
      showToast("Decris la tache");
      return;
    }
    if (frequence === "hebdomadaire" && joursSemaine.length === 0) {
      showToast("Choisis au moins un jour");
      return;
    }

    setSaving(true);
    await fetch("/api/taches-recurrentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texte,
        frequence,
        joursSemaine: frequence === "hebdomadaire" ? joursSemaine : [],
        heure: heure || null,
      }),
    });
    setTexte("");
    setFrequence("journaliere");
    setJoursSemaine([]);
    setHeure("");
    setSaving(false);
    showToast("Tache recurrente creee");
    router.refresh();
  }

  async function basculerActif(id: string) {
    await fetch(`/api/taches-recurrentes/${id}/toggle`, { method: "POST" });
    router.refresh();
  }

  async function supprimer(id: string) {
    await fetch(`/api/taches-recurrentes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div className="card">
        <h2>Taches recurrentes</h2>
        {initialModeles.length === 0 && <div className="empty">Aucune tache recurrente pour l&apos;instant.</div>}
        {initialModeles.map((m) => (
          <div className="obj-card" key={m.id} style={{ opacity: m.actif ? 1 : 0.55 }}>
            <div className="obj-top">
              <div className="obj-name">
                <span
                  className="obj-type-badge"
                  style={{
                    background: m.frequence === "hebdomadaire" ? "#2C8FE022" : "#FFB02022",
                    color: m.frequence === "hebdomadaire" ? "var(--blue-deep)" : "var(--sun)",
                    marginRight: 6,
                  }}
                >
                  {m.frequence === "hebdomadaire" ? "Hebdo" : "Jour"}
                </span>
                {m.texte}
              </div>
              <button className="obj-del" onClick={() => supprimer(m.id)}>Suppr.</button>
            </div>
            <div className="obj-meta">
              <span>{describeFrequence(m)}{m.heure ? ` · ${m.heure}` : ""}</span>
              <button type="button" className="mode-btn active" style={{ flex: "0 0 auto", padding: "4px 10px" }} onClick={() => basculerActif(m.id)}>
                {m.actif ? "Desactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Nouvelle tache recurrente</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="r-texte">Tache</label>
            <input id="r-texte" type="text" placeholder="Ex : Reviser 20 min d'espagnol" value={texte} onChange={(e) => setTexte(e.target.value)} />
          </div>
        </div>

        <div className="mode-toggle" role="radiogroup" aria-label="Frequence">
          <button className={`mode-btn ${frequence === "journaliere" ? "active" : ""}`} onClick={() => setFrequence("journaliere")}>Journaliere</button>
          <button className={`mode-btn ${frequence === "hebdomadaire" ? "active" : ""}`} onClick={() => setFrequence("hebdomadaire")}>Hebdomadaire</button>
        </div>

        {frequence === "hebdomadaire" && (
          <div className="row" style={{ marginBottom: 14 }}>
            {JOURS.map((j) => (
              <button
                key={j.valeur}
                type="button"
                className={`mode-btn ${joursSemaine.includes(j.valeur) ? "active" : ""}`}
                style={{ flex: "0 0 40px", padding: "8px 0" }}
                onClick={() => toggleJour(j.valeur)}
              >
                {j.label}
              </button>
            ))}
          </div>
        )}

        <div className="row">
          <div className="field">
            <label htmlFor="r-heure">Heure (optionnel)</label>
            <input id="r-heure" type="time" value={heure} onChange={(e) => setHeure(e.target.value)} />
          </div>
        </div>

        <button className="btn-primary" onClick={creer} disabled={saving}>
          {saving ? "Creation…" : "Creer la tache recurrente"}
        </button>
      </div>
    </>
  );
}
