"use client";
import { useState } from "react";
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

  async function toggle(d: DisciplineVM) {
    setPending(d.id);
    await fetch(`/api/disciplines/${d.id}/toggle`, { method: "POST" });
    if (!d.faitAujourdhui) showToast(`${d.nom} — bien joué !`);
    setPending(null);
    router.refresh();
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
                <div className="disc-streak" style={{ color: d.couleur }}>
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
              onClick={() => toggle(d)}
            >
              {d.faitAujourdhui ? "✓ Fait" : "Fait aujourd'hui"}
            </button>
          </div>
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
