"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

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

function flameLabel(niveau: 0 | 1 | 2 | 3): string {
  if (niveau <= 0) return "—";
  return "🔥".repeat(niveau);
}

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
      const t = setTimeout(() => setPopped(new Set()), 500);
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
    if (!d.faitAujourdhui) showToast(`${d.nom} — bien joué !`);
    setPending(null);
    setPendingNoteFor(null);
    setNoteDraft("");
    router.refresh();
  }

  function onClickPrincipal(d: DisciplineVM) {
    if (d.faitAujourdhui) {
      toggle(d); // un-check immediat, pas de prompt de note
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

  return (
    <div>
      {disciplines.map((d) => (
        <div className="disc-card" style={{ borderColor: `${d.couleur}33` }} key={d.id}>
          <div className="disc-top">
            <div className="disc-left">
              <div className="disc-icon" style={{ background: `${d.couleur}22` }}>{d.icone}</div>
              <div>
                <div className="disc-name">{d.nom}</div>
                <div className={`disc-streak ${popped.has(d.id) ? "pop" : ""}`} style={{ color: d.couleur }}>
                  {d.streak} jour{d.streak > 1 ? "s" : ""} d&apos;affilée
                </div>
              </div>
            </div>
            <button
              className="disc-check"
              disabled={pending === d.id}
              style={{
                background: d.faitAujourdhui ? d.couleur : "#F0F5FA",
                color: d.faitAujourdhui ? "#fff" : d.couleur,
              }}
              onClick={() => onClickPrincipal(d)}
            >
              {d.faitAujourdhui ? "✓ Fait" : pendingNoteFor === d.id ? "Annuler" : "Fait aujourd'hui"}
            </button>
          </div>

          {pendingNoteFor === d.id && (
            <div className="disc-note-form">
              <textarea
                className="note-textarea"
                placeholder="Un mot sur cette session ? (optionnel)"
                rows={2}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="mode-btn active"
                style={{ flex: "0 0 auto", padding: "8px 16px" }}
                disabled={pending === d.id}
                onClick={() => toggle(d, noteDraft.trim())}
              >
                Valider
              </button>
            </div>
          )}

          <div className="disc-heatmap">
            {d.historique14.map((j) => (
              <div
                className="disc-sq"
                key={j.date}
                style={{ background: j.fait ? d.couleur : "var(--steel)" }}
                title={j.date}
              />
            ))}
          </div>
          <div className="disc-flames">{flameLabel(d.niveauFlamme)}</div>
        </div>
      ))}
    </div>
  );
}
