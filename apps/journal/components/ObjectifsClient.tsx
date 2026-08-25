"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

type TypeObjectif = "temps" | "performance";

type Objectif = {
  id: string;
  nom: string;
  type: TypeObjectif;
  deadline: string | null;
  heuresCible: number | null;
  minutesInvesties: number;
  poidsCible: number | null;
  meilleurPoidsAtteint: number | null;
  progression: number;
  unite: string;
};

export default function ObjectifsClient({ initialObjectifs }: { initialObjectifs: Objectif[] }) {
  const router = useRouter();
  const [type, setType] = useState<TypeObjectif>("temps");
  const [nom, setNom] = useState("");
  const [heures, setHeures] = useState(20);
  const [poids, setPoids] = useState(50);
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [poidsInputs, setPoidsInputs] = useState<Record<string, string>>({});

  async function creer() {
    if (!nom) {
      showToast("Nomme l'objectif");
      return;
    }
    if (type === "temps" && !heures) return;
    if (type === "performance" && !poids) return;

    setSaving(true);
    await fetch("/api/objectifs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        type === "temps"
          ? { nom, disciplineId: null, heuresCible: heures, deadline: deadline || null, type }
          : { nom, disciplineId: null, deadline: deadline || null, type, poidsCible: poids }
      ),
    });
    setNom("");
    setHeures(20);
    setPoids(50);
    setDeadline("");
    setSaving(false);
    showToast("Objectif créé");
    router.refresh();
  }

  async function ajouterMinutes(id: string, minutes: number) {
    await fetch(`/api/objectifs/${id}/minutes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes }),
    });
    router.refresh();
  }

  async function mettreAJourPoids(id: string) {
    const valeur = parseFloat(poidsInputs[id]);
    if (!valeur || valeur < 0) return;
    await fetch(`/api/objectifs/${id}/poids`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poids: valeur }),
    });
    showToast("Progression mise à jour");
    router.refresh();
  }

  async function supprimer(id: string) {
    await fetch(`/api/objectifs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div className="card">
        <h2>Objectifs en cours</h2>
        {initialObjectifs.length === 0 && <div className="empty">Aucun objectif pour l&apos;instant.</div>}
        {initialObjectifs.map((o) => (
          <div className="obj-card" key={o.id}>
            <div className="obj-top">
              <div className="obj-name">
                <span
                  className="obj-type-badge"
                  style={{
                    background: o.type === "performance" ? "#2C8FE022" : "#FFB02022",
                    color: o.type === "performance" ? "var(--blue-deep)" : "var(--sun)",
                    marginRight: 6,
                  }}
                >
                  {o.type === "performance" ? "Perf" : "Temps"}
                </span>
                {o.nom}
              </div>
              <button className="obj-del" onClick={() => supprimer(o.id)}>Suppr.</button>
            </div>
            <div className="obj-bar-bg"><div className="obj-bar-fill" style={{ width: `${o.progression}%` }} /></div>
            <div className="obj-meta">
              <span>{o.unite}</span>
              <span>{o.progression}%{o.deadline ? ` · échéance ${o.deadline}` : ""}</span>
            </div>

            {o.type === "temps" ? (
              <div className="row" style={{ marginTop: 10 }}>
                {[15, 30, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="mode-btn active"
                    style={{ flex: "0 0 auto", padding: "6px 12px" }}
                    onClick={() => ajouterMinutes(o.id, m)}
                  >
                    +{m < 60 ? `${m}min` : "1h"}
                  </button>
                ))}
              </div>
            ) : (
              <div className="row" style={{ marginTop: 10, alignItems: "flex-end" }}>
                <div className="field small">
                  <label htmlFor={`poids-${o.id}`}>Nouveau record (kg)</label>
                  <input
                    id={`poids-${o.id}`}
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    placeholder={String(o.meilleurPoidsAtteint ?? 0)}
                    value={poidsInputs[o.id] ?? ""}
                    onChange={(e) => setPoidsInputs((prev) => ({ ...prev, [o.id]: e.target.value }))}
                  />
                </div>
                <button type="button" className="mode-btn active" style={{ flex: "0 0 auto", padding: "9px 14px" }} onClick={() => mettreAJourPoids(o.id)}>
                  Mettre à jour
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Nouvel objectif</h2>
        <div className="mode-toggle" role="radiogroup" aria-label="Type d'objectif">
          <button className={`mode-btn ${type === "temps" ? "active" : ""}`} onClick={() => setType("temps")}>Temps</button>
          <button className={`mode-btn ${type === "performance" ? "active" : ""}`} onClick={() => setType("performance")}>Performance</button>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="o-nom">Nom</label>
            <input id="o-nom" type="text" placeholder="Ex : Apprendre l'espagnol" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
        </div>

        {type === "temps" ? (
          <div className="row">
            <div className="field">
              <label htmlFor="o-heures">Heures visées</label>
              <input id="o-heures" type="number" inputMode="decimal" value={heures} onChange={(e) => setHeures(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="field">
              <label htmlFor="o-deadline">Échéance</label>
              <input id="o-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="field">
              <label htmlFor="o-poids">Poids cible (kg)</label>
              <input id="o-poids" type="number" step="0.5" inputMode="decimal" value={poids} onChange={(e) => setPoids(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="field">
              <label htmlFor="o-deadline-perf">Échéance</label>
              <input id="o-deadline-perf" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={creer} disabled={saving}>
          {saving ? "Création…" : "Créer l'objectif"}
        </button>
      </div>
    </>
  );
}
