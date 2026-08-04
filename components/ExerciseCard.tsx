"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MuscleSilhouette from "./MuscleSilhouette";

type Cible = { poidsCible: number; repsCible: number; justification: string } | null;
type SerieDuJour = { id: string; poids: number; reps: number; sets: number };

export default function ExerciseCard({
  exercice,
}: {
  exercice: {
    id: string;
    nom: string;
    groupeMusculaire: string;
    prioritaire: boolean;
    cible: Cible;
    seriesAujourdhui: SerieDuJour[];
  };
}) {
  const router = useRouter();
  const [poids, setPoids] = useState(exercice.cible?.poidsCible ?? 0);
  const [reps, setReps] = useState(exercice.cible?.repsCible ?? 10);
  const [sets, setSets] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function enregistrer() {
    setSaving(true);
    await fetch("/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        exerciceId: exercice.id,
        poids, reps, sets, note,
      }),
    });
    setSaving(false);
    setNote("");
    router.refresh();
  }

  const dejaFait = exercice.seriesAujourdhui.length > 0;

  return (
    <div className={`rounded-xl border p-4 mb-3 ${exercice.prioritaire ? "border-[#FF5A1F] bg-[#2a1c10]" : "border-[#2a2c34] bg-[#1b1d23]"}`}>
      <div className="flex items-start gap-3">
        <MuscleSilhouette groupe={exercice.groupeMusculaire} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[15px]">{exercice.nom}</h3>
            {exercice.prioritaire && <span className="text-[10px] text-[#FF5A1F]">★ priorisé</span>}
          </div>
          <p className="text-[11px] text-[#8b8d98] uppercase tracking-wide">{exercice.groupeMusculaire}</p>

          {exercice.cible ? (
            <p className="text-xs text-[#ffd8c2] mt-1">
              🎯 Cible : {exercice.cible.poidsCible}kg × {exercice.cible.repsCible} reps — {exercice.cible.justification}
            </p>
          ) : (
            <p className="text-xs text-[#8b8d98] mt-1">Première fois sur cet exercice — enregistre ta série de référence.</p>
          )}

          {dejaFait && (
            <p className="text-xs text-[#4CAF50] mt-1">
              ✓ Déjà loggé aujourd'hui : {exercice.seriesAujourdhui.map((s) => `${s.poids}kg×${s.reps}`).join(", ")}
            </p>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-[#3B82C4] mt-2"
          >
            {open ? "Fermer" : dejaFait ? "+ Ajouter une série" : "Logger une série"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-[#8b8d98] uppercase">Poids (kg)</label>
            <input type="number" step="0.5" value={poids} onChange={(e) => setPoids(parseFloat(e.target.value) || 0)} className="w-full text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-[#8b8d98] uppercase">Reps</label>
            <input type="number" value={reps} onChange={(e) => setReps(parseInt(e.target.value) || 0)} className="w-full text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-[#8b8d98] uppercase">Séries</label>
            <input type="number" value={sets} onChange={(e) => setSets(parseInt(e.target.value) || 0)} className="w-full text-sm" />
          </div>
          <input
            type="text" placeholder="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)}
            className="col-span-3 text-sm"
          />
          <button
            onClick={enregistrer}
            disabled={saving}
            className="col-span-3 bg-gradient-to-b from-[#ff6b34] to-[#8a3517] text-[#191008] font-bold uppercase text-xs py-2.5 rounded-md mt-1"
          >
            {saving ? "..." : "Enregistrer la série"}
          </button>
        </div>
      )}
    </div>
  );
}
