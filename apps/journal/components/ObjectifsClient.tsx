"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

type TypeObjectif = "temps" | "metrique";
type Sens = "croissant" | "decroissant";

type Objectif = {
  id: string;
  nom: string;
  type: TypeObjectif;
  deadline: string | null;
  heuresCible: number | null;
  minutesInvesties: number;
  rawUnite: string | null;
  valeurCible: number | null;
  valeurActuelle: number | null;
  progression: number;
  unite: string;
};

export default function ObjectifsClient({ initialObjectifs }: { initialObjectifs: Objectif[] }) {
  const router = useRouter();
  const [type, setType] = useState<TypeObjectif>("temps");
  const [nom, setNom] = useState("");
  const [heures, setHeures] = useState(20);
  const [uniteLibre, setUniteLibre] = useState("");
  const [valeurDepart, setValeurDepart] = useState(0);
  const [valeurCible, setValeurCible] = useState(100);
  const [sens, setSens] = useState<Sens>("croissant");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [valeurInputs, setValeurInputs] = useState<Record<string, string>>({});

  async function creer() {
    if (!nom) {
      showToast("Nomme l'objectif");
      return;
    }
    if (type === "temps" && !heures) return;
    if (type === "metrique" && (!uniteLibre || valeurCible == null)) {
      showToast("Precise l'unite et la valeur cible");
      return;
    }

    setSaving(true);
    await fetch("/api/objectifs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        type === "temps"
          ? { nom, disciplineId: null, heuresCible: heures, deadline: deadline || null, type }
          : { nom, disciplineId: null, deadline: deadline || null, type, unite: uniteLibre, valeurDepart, valeurCible, sens }
      ),
    });
    setNom("");
    setHeures(20);
    setUniteLibre("");
    setValeurDepart(0);
    setValeurCible(100);
    setSens("croissant");
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

  async function mettreAJourValeur(id: string) {
    const valeur = parseFloat(valeurInputs[id]);
    if (Number.isNaN(valeur)) return;
    await fetch(`/api/objectifs/${id}/valeur`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valeur }),
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
                    background: o.type === "metrique" ? "#2C8FE022" : "#FFB02022",
                    color: o.type === "metrique" ? "var(--blue-deep)" : "var(--sun)",
                    marginRight: 6,
                  }}
                >
                  {o.type === "metrique" ? (o.rawUnite || "Metrique") : "Temps"}
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
                  <label htmlFor={`valeur-${o.id}`}>Nouvelle valeur ({o.rawUnite})</label>
                  <input
                    id={`valeur-${o.id}`}
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    placeholder={String(o.valeurActuelle ?? 0)}
                    value={valeurInputs[o.id] ?? ""}
                    onChange={(e) => setValeurInputs((prev) => ({ ...prev, [o.id]: e.target.value }))}
                  />
                </div>
                <button type="button" className="mode-btn active" style={{ flex: "0 0 auto", padding: "9px 14px" }} onClick={() => mettreAJourValeur(o.id)}>
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
          <button className={`mode-btn ${type === "metrique" ? "active" : ""}`} onClick={() => setType("metrique")}>Métrique libre</button>
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
          <>
            <div className="row">
              <div className="field">
                <label htmlFor="o-unite">Unité</label>
                <input id="o-unite" type="text" placeholder="Ex : Elo, pages, km" value={uniteLibre} onChange={(e) => setUniteLibre(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="o-deadline-metrique">Échéance</label>
                <input id="o-deadline-metrique" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="o-valeur-depart">Valeur de départ</label>
                <input id="o-valeur-depart" type="number" step="0.5" inputMode="decimal" value={valeurDepart} onChange={(e) => setValeurDepart(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="field">
                <label htmlFor="o-valeur-cible">Valeur cible</label>
                <input id="o-valeur-cible" type="number" step="0.5" inputMode="decimal" value={valeurCible} onChange={(e) => setValeurCible(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="mode-toggle" role="radiogroup" aria-label="Sens de progression">
              <button className={`mode-btn ${sens === "croissant" ? "active" : ""}`} onClick={() => setSens("croissant")}>Croissant</button>
              <button className={`mode-btn ${sens === "decroissant" ? "active" : ""}`} onClick={() => setSens("decroissant")}>Décroissant</button>
            </div>
          </>
        )}

        <button className="btn-primary" onClick={creer} disabled={saving}>
          {saving ? "Création…" : "Créer l'objectif"}
        </button>
      </div>
    </>
  );
}
