"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import Segmented from "./Segmented";
import { IconRepeat, IconPlus, IconX, IconClock } from "./icons";

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
      showToast("Décris la tâche");
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
    showToast("Tâche récurrente créée");
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

  const actives = initialModeles.filter((m) => m.actif).length;

  return (
    <div className="grid g-main">
      <section className="panel panel-pad-lg spot">
        <div className="panel-head">
          <div className="chip violet">
            <IconRepeat />
          </div>
          <div className="ph-text">
            <h2>Modèles récurrents</h2>
            <p>
              {initialModeles.length === 0
                ? "Aucun modèle"
                : `${actives} actif${actives > 1 ? "s" : ""} sur ${initialModeles.length}`}
            </p>
          </div>
        </div>

        {initialModeles.length === 0 ? (
          <div className="empty">
            <IconRepeat />
            Les tâches récurrentes se posent toutes seules sur ta journée. Crée la première à droite.
          </div>
        ) : (
          <div className="grid g-2">
            {initialModeles.map((m) => (
              <div className="obj-card" key={m.id} style={{ opacity: m.actif ? 1 : 0.6 }}>
                <div className="obj-top">
                  <div style={{ minWidth: 0 }}>
                    <div className="obj-name">{m.texte}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <span className={`tag ${m.frequence === "hebdomadaire" ? "" : "brand"}`}>
                        {describeFrequence(m)}
                      </span>
                      {m.heure && (
                        <span className="tag">
                          <IconClock style={{ width: 11, height: 11 }} />
                          {m.heure}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="del" style={{ opacity: 1 }} onClick={() => supprimer(m.id)} aria-label="Supprimer le modèle">
                    <IconX />
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button type="button" className="btn btn-sm" onClick={() => basculerActif(m.id)}>
                    {m.actif ? "Désactiver" : "Réactiver"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel panel-pad-lg spot">
        <div className="panel-head">
          <div className="chip teal">
            <IconPlus />
          </div>
          <div className="ph-text">
            <h2>Nouveau modèle</h2>
            <p>Il se matérialisera automatiquement chaque jour concerné</p>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="r-texte">Tâche</label>
            <input
              id="r-texte"
              type="text"
              placeholder="Ex : Réviser 20 min d'espagnol"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label>Fréquence</label>
          <Segmented
            full
            ariaLabel="Fréquence"
            value={frequence}
            onChange={setFrequence}
            options={[
              { value: "journaliere", label: "Journalière" },
              { value: "hebdomadaire", label: "Hebdomadaire" },
            ]}
          />
        </div>

        {frequence === "hebdomadaire" && (
          <div style={{ marginBottom: 14 }}>
            <label>Jours concernés</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {JOURS.map((j) => (
                <button
                  key={j.valeur}
                  type="button"
                  className={`pill pill-day ${joursSemaine.includes(j.valeur) ? "on" : ""}`}
                  onClick={() => toggleJour(j.valeur)}
                  aria-pressed={joursSemaine.includes(j.valeur)}
                >
                  {j.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="row">
          <div className="field">
            <label htmlFor="r-heure">Heure (optionnel)</label>
            <input id="r-heure" type="time" value={heure} onChange={(e) => setHeure(e.target.value)} />
          </div>
        </div>

        <button className="btn-primary" onClick={creer} disabled={saving}>
          <IconPlus style={{ width: 15, height: 15 }} />
          {saving ? "Création…" : "Créer le modèle"}
        </button>
      </section>
    </div>
  );
}
