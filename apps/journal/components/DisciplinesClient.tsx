"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { IconCheck, IconFlame } from "./icons";

type DisciplineVM = {
  id: string;
  nom: string;
  icone: string;
  couleur: string;
  streak: number;
  niveauFlamme: 0 | 1 | 2 | 3;
  faitAujourdhui: boolean;
  historique14: { date: string; fait: boolean }[];
};

export default function DisciplinesClient({ disciplines }: { disciplines: DisciplineVM[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [pendingNoteFor, setPendingNoteFor] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const prevStreaks = useRef<Record<string, number>>({});
  const [popped, setPopped] = useState<Set<string>>(new Set());

  useEffect(() => {
    const augmentes = new Set<string>();
    for (const d of disciplines) {
      const precedent = prevStreaks.current[d.id];
      if (precedent !== undefined && d.streak > precedent) augmentes.add(d.id);
      prevStreaks.current[d.id] = d.streak;
    }
    if (augmentes.size > 0) {
      setPopped(augmentes);
      const t = setTimeout(() => setPopped(new Set()), 600);
      return () => clearTimeout(t);
    }
  }, [disciplines]);

  async function toggle(d: DisciplineVM, note?: string) {
    setPending(d.id);
    await fetch(`/api/disciplines/${d.id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note || null }),
    });
    if (!d.faitAujourdhui) showToast(`${d.nom} — validé`);
    setPending(null);
    setPendingNoteFor(null);
    setNoteDraft("");
    router.refresh();
  }

  function onClickPrincipal(d: DisciplineVM) {
    if (d.faitAujourdhui) {
      toggle(d);
      return;
    }
    if (pendingNoteFor === d.id) {
      setPendingNoteFor(null);
      setNoteDraft("");
      return;
    }
    setPendingNoteFor(d.id);
    setNoteDraft("");
  }

  if (disciplines.length === 0) {
    return (
      <section className="panel panel-pad-lg">
        <div className="empty">
          <IconFlame />
          Aucune discipline configurée pour l&apos;instant.
        </div>
      </section>
    );
  }

  return (
    <div className="grid g-2">
      {disciplines.map((d) => {
        const jours = d.historique14.filter((j) => j.fait).length;
        return (
          <section className="disc-card spot" key={d.id}>
            <div className="disc-top">
              <div className="disc-left">
                <div
                  className="disc-icon"
                  style={{ background: `${d.couleur}1a`, boxShadow: `inset 0 0 0 1px ${d.couleur}33` }}
                >
                  {d.icone}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="disc-name">{d.nom}</div>
                  <div className={`disc-streak ${popped.has(d.id) ? "pop" : ""}`} style={{ color: d.couleur }}>
                    <IconFlame style={{ width: 13, height: 13 }} />
                    {d.streak === 0 ? "aucune série" : `${d.streak} jour${d.streak > 1 ? "s" : ""} d'affilée`}
                  </div>
                </div>
              </div>

              <button
                className="disc-check"
                disabled={pending === d.id}
                style={
                  d.faitAujourdhui
                    ? { background: d.couleur, color: "#fff", boxShadow: `0 6px 14px -6px ${d.couleur}` }
                    : pendingNoteFor === d.id
                      ? { background: "var(--surface-3)", color: "var(--ink-2)" }
                      : { background: `${d.couleur}14`, color: d.couleur, boxShadow: `inset 0 0 0 1px ${d.couleur}33` }
                }
                onClick={() => onClickPrincipal(d)}
              >
                {d.faitAujourdhui ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <IconCheck style={{ width: 14, height: 14 }} /> Fait
                  </span>
                ) : pendingNoteFor === d.id ? (
                  "Annuler"
                ) : (
                  "Valider aujourd'hui"
                )}
              </button>
            </div>

            {pendingNoteFor === d.id && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 14 }}>
                <textarea
                  placeholder="Un mot sur cette session ? (optionnel)"
                  rows={2}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn"
                  style={{ flexShrink: 0, alignSelf: "stretch" }}
                  disabled={pending === d.id}
                  onClick={() => toggle(d, noteDraft.trim())}
                >
                  Valider
                </button>
              </div>
            )}

            <div>
              <div className="disc-heat">
                {d.historique14.map((j) => (
                  <div
                    className="disc-sq"
                    key={j.date}
                    style={
                      j.fait
                        ? { background: d.couleur, boxShadow: `0 2px 6px -2px ${d.couleur}99` }
                        : undefined
                    }
                    title={new Date(j.date + "T00:00:00").toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  />
                ))}
              </div>
              <div className="disc-heat-legend">
                <span>14 derniers jours</span>
                <span>{jours} validés</span>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
