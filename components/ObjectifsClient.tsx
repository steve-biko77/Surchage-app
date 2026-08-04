"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Objectif = { id: string; nom: string; heuresCible: number; minutesInvesties: number; deadline: string | null };

export default function ObjectifsClient({ initialObjectifs }: { initialObjectifs: Objectif[] }) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [heures, setHeures] = useState(50);
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  async function creer() {
    if (!nom || !heures) return;
    setSaving(true);
    await fetch("/api/objectifs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, disciplineId: null, heuresCible: heures, deadline: deadline || null }),
    });
    setNom(""); setHeures(50); setDeadline("");
    setSaving(false);
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

  return (
    <div>
      {initialObjectifs.length === 0 && (
        <p className="text-sm text-[#8b8d98] mb-4">Aucun objectif pour l'instant.</p>
      )}
      {initialObjectifs.map((o) => {
        const pct = o.heuresCible > 0 ? Math.min(100, Math.round((o.minutesInvesties / 60 / o.heuresCible) * 100)) : 0;
        return (
          <div key={o.id} className="rounded-xl border border-[#2a2c34] bg-[#1b1d23] p-4 mb-3">
            <div className="flex justify-between items-baseline mb-2">
              <h3 className="font-bold">{o.nom}</h3>
              {o.deadline && <span className="text-[10px] text-[#8b8d98]">échéance {o.deadline}</span>}
            </div>
            <div className="h-2 rounded bg-[#14151a] overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-[#8a3517] to-[#FF5A1F]" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-[#8b8d98] mb-2">
              <span>{Math.round((o.minutesInvesties / 60) * 10) / 10} / {o.heuresCible}h</span>
              <span>{pct}%</span>
            </div>
            <div className="flex gap-2">
              {[15, 30, 60].map((m) => (
                <button key={m} onClick={() => ajouterMinutes(o.id, m)} className="text-[11px] px-2.5 py-1 rounded-full border border-[#3a3e4a] text-[#EDEDEA]">
                  +{m < 60 ? `${m}min` : "1h"}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-[#3B82C4]/40 bg-[#1b1d23] p-4 mt-6">
        <h3 className="text-xs uppercase tracking-wide text-[#3B82C4] font-bold mb-3">Nouvel objectif</h3>
        <input placeholder="Nom de l'objectif" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full text-sm mb-2" />
        <div className="flex gap-2 mb-3">
          <input type="number" placeholder="Heures visées" value={heures} onChange={(e) => setHeures(parseFloat(e.target.value) || 0)} className="flex-1 text-sm" />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="flex-1 text-sm" />
        </div>
        <button onClick={creer} disabled={saving} className="w-full bg-gradient-to-b from-[#5ba3e0] to-[#2a5f8f] text-[#0a1420] font-bold uppercase text-xs py-2.5 rounded-md">
          {saving ? "..." : "Créer l'objectif"}
        </button>
      </div>
    </div>
  );
}
