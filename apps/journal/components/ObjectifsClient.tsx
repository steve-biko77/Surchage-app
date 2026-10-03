"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { ProgressRing } from "./charts";
import Segmented from "./Segmented";
import { IconTarget, IconPlus, IconClock, IconX } from "./icons";

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
      showToast("Précise l'unité et la valeur cible");
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
    showToast(minutes >= 60 ? "+1 h enregistrée" : `+${minutes} min enregistrées`);
    router.refresh();
  }

  async function mettreAJourValeur(id: string) {
    const valeur = parseFloat(valeurInputs[id]);
    if (Number.isNaN(valeur)) {
      showToast("Entre une valeur");
      return;
    }
    await fetch(`/api/objectifs/${id}/valeur`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valeur }),
    });
    setValeurInputs((prev) => ({ ...prev, [id]: "" }));
    showToast("Progression mise à jour");
    router.refresh();
  }

  async function supprimer(id: string) {
    await fetch(`/api/objectifs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid g-main">
      <section className="panel panel-pad-lg spot">
        <div className="panel-head">
          <div className="chip">
            <IconTarget />
          </div>
          <div className="ph-text">
            <h2>Objectifs en cours</h2>
            <p>
              {initialObjectifs.length === 0
                ? "Aucun pour l'instant"
                : `${initialObjectifs.length} objectif${initialObjectifs.length > 1 ? "s" : ""} suivi${initialObjectifs.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {initialObjectifs.length === 0 ? (
          <div className="empty">
            <IconTarget />
            Crée ton premier objectif depuis le panneau de droite.
          </div>
        ) : (
          <div className="grid g-2">
            {initialObjectifs.map((o, i) => (
              <div className="obj-card" key={o.id}>
                <div className="obj-top">
                  <div style={{ display: "flex", gap: 13, alignItems: "center", minWidth: 0 }}>
                    <ProgressRing
                      value={o.progression}
                      size={54}
                      stroke={6}
                      delay={i * 90}
                      color={o.type === "metrique" ? "#6d6ff0" : "#1d7fe0"}
                      colorSoft={o.type === "metrique" ? "#9294f6" : "#4aa3f5"}
                    >
                      <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "-0.02em" }}>{o.progression}%</span>
                    </ProgressRing>
                    <div style={{ minWidth: 0 }}>
                      <div className="obj-name">{o.nom}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                        <span className={`tag ${o.type === "metrique" ? "" : "brand"}`}>
                          {o.type === "metrique" ? o.rawUnite || "Métrique" : "Temps"}
                        </span>
                        {o.deadline && <span className="tag">échéance {o.deadline}</span>}
                      </div>
                    </div>
                  </div>
                  <button className="del" style={{ opacity: 1 }} onClick={() => supprimer(o.id)} aria-label="Supprimer l'objectif">
                    <IconX />
                  </button>
                </div>

                <div className="obj-meta" style={{ marginTop: 10 }}>
                  <span>
                    <strong>{o.unite}</strong>
                  </span>
                </div>

                <div className="obj-actions">
                  {o.type === "temps" ? (
                    [15, 30, 60].map((m) => (
                      <button key={m} type="button" className="pill" onClick={() => ajouterMinutes(o.id, m)}>
                        <IconClock style={{ width: 12, height: 12, display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
                        {m < 60 ? `${m} min` : "1 h"}
                      </button>
                    ))
                  ) : (
                    <>
                      <div className="field small" style={{ flex: "1 1 110px" }}>
                        <label htmlFor={`valeur-${o.id}`}>Nouvelle valeur ({o.rawUnite})</label>
                        <input
                          id={`valeur-${o.id}`}
                          type="number"
                          step="0.5"
                          inputMode="decimal"
                          placeholder={String(o.valeurActuelle ?? 0)}
                          value={valeurInputs[o.id] ?? ""}
                          onChange={(e) => setValeurInputs((prev) => ({ ...prev, [o.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") mettreAJourValeur(o.id);
                          }}
                        />
                      </div>
                      <button type="button" className="btn" onClick={() => mettreAJourValeur(o.id)}>
                        Enregistrer
                      </button>
                    </>
                  )}
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
            <h2>Nouvel objectif</h2>
            <p>Du temps investi, ou n&apos;importe quelle métrique</p>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <Segmented
            full
            ariaLabel="Type d'objectif"
            value={type}
            onChange={setType}
            options={[
              { value: "temps", label: "Temps" },
              { value: "metrique", label: "Métrique libre" },
            ]}
          />
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="o-nom">Nom</label>
            <input
              id="o-nom"
              type="text"
              placeholder={type === "temps" ? "Ex : Apprendre l'espagnol" : "Ex : Monter à 1600 Elo"}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
        </div>

        {type === "temps" ? (
          <div className="row">
            <div className="field">
              <label htmlFor="o-heures">Heures visées</label>
              <input
                id="o-heures"
                type="number"
                inputMode="decimal"
                value={heures}
                onChange={(e) => setHeures(parseFloat(e.target.value) || 0)}
              />
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
                <input
                  id="o-unite"
                  type="text"
                  placeholder="Elo, pages, km…"
                  value={uniteLibre}
                  onChange={(e) => setUniteLibre(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="o-deadline-metrique">Échéance</label>
                <input
                  id="o-deadline-metrique"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="o-valeur-depart">Valeur de départ</label>
                <input
                  id="o-valeur-depart"
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  value={valeurDepart}
                  onChange={(e) => setValeurDepart(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label htmlFor="o-valeur-cible">Valeur cible</label>
                <input
                  id="o-valeur-cible"
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  value={valeurCible}
                  onChange={(e) => setValeurCible(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Sens de progression</label>
              <Segmented
                full
                ariaLabel="Sens de progression"
                value={sens}
                onChange={setSens}
                options={[
                  { value: "croissant", label: "Croissant" },
                  { value: "decroissant", label: "Décroissant" },
                ]}
              />
            </div>
          </>
        )}

        <button className="btn-primary" onClick={creer} disabled={saving}>
          <IconPlus style={{ width: 15, height: 15 }} />
          {saving ? "Création…" : "Créer l'objectif"}
        </button>
      </section>
    </div>
  );
}
