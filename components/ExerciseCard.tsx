"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, CheckCircle2, Target, ChevronDown, Plus } from "lucide-react";
import MuscleSilhouette from "./MuscleSilhouette";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { todayISO } from "@/lib/domain/services";

type Cible = { poidsCible: number; repsCible: number; justification: string } | null;
type SerieDuJour = { id: string; poids: number; reps: number; sets: number; note?: string | null };

export default function ExerciseCard({
  exercice,
  estProchain = false,
  rayerSiComplete = false,
}: {
  exercice: {
    id: string;
    nom: string;
    groupeMusculaire: string;
    prioritaire: boolean;
    cible: Cible;
    seriesAujourdhui: SerieDuJour[];
  };
  /** Met en avant cet exercice comme "le prochain a faire" (vue /entrainement-en-cours) */
  estProchain?: boolean;
  /** Applique le style raye + attenue une fois complete (vue /entrainement-en-cours uniquement) */
  rayerSiComplete?: boolean;
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
        date: todayISO(),
        exerciceId: exercice.id,
        poids, reps, sets, note,
      }),
    });
    setSaving(false);
    setNote("");
    setOpen(false);
    router.refresh();
  }

  const dejaFait = exercice.seriesAujourdhui.length > 0;
  const rayer = rayerSiComplete && dejaFait;

  return (
    <Card
      className={`mb-3 overflow-hidden transition-opacity ${
        estProchain ? "border-[#FF5A1F] shadow-[0_0_0_1px_rgba(255,90,31,0.4)]" : exercice.prioritaire ? "border-[#FF5A1F]/50" : ""
      } ${rayer && !estProchain ? "opacity-60" : ""}`}
    >
      {(exercice.prioritaire || estProchain) && <div className="h-0.5 w-full bg-gradient-to-r from-[#FF5A1F] to-transparent" aria-hidden="true" />}
      <div className="flex items-start gap-3 p-4">
        <Link href={`/exercices/${exercice.id}`} aria-label={`Voir la fiche de ${exercice.nom}`}>
          <MuscleSilhouette groupe={exercice.groupeMusculaire} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`truncate font-heading text-base font-bold leading-tight ${rayer ? "line-through decoration-[var(--grey)]" : ""}`}>
              {exercice.nom}
            </h3>
            {exercice.prioritaire && (
              <Star className="h-3.5 w-3.5 shrink-0 text-[#FF5A1F]" fill="#FF5A1F" aria-label="Exercice priorisé" />
            )}
            {estProchain && <Badge variant="accent" className="shrink-0">Suivant</Badge>}
          </div>
          <Badge variant="default" className="mt-1.5">{exercice.groupeMusculaire}</Badge>

          {exercice.cible ? (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-[#ffd8c2]">
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF5A1F]" aria-hidden="true" />
              <span>
                <b className="font-heading text-[13px] tracking-wide">{exercice.cible.poidsCible}kg × {exercice.cible.repsCible}</b>
                <span className="block text-[var(--grey)]">{exercice.cible.justification}</span>
              </span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-[var(--grey)]">Première fois sur cet exercice — enregistre ta série de référence.</p>
          )}

          {dejaFait && (
            <div className="mt-2 text-xs text-[var(--success)]">
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {exercice.seriesAujourdhui.map((s) => `${s.poids}kg×${s.reps}`).join(", ")}
              </p>
              {exercice.seriesAujourdhui.filter((s) => s.note).map((s) => (
                <p key={s.id} className="ml-5 mt-0.5 italic text-[var(--grey)]">&laquo; {s.note} &raquo;</p>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="mt-2 -ml-2 h-8 px-2 text-[#3B82C4] hover:text-[#5ba3e0]"
          >
            {open ? (
              <>Fermer <ChevronDown className="h-3.5 w-3.5 rotate-180 transition-transform" /></>
            ) : dejaFait ? (
              <>Ajouter une série <Plus className="h-3.5 w-3.5" /></>
            ) : (
              <>Logger une série <ChevronDown className="h-3.5 w-3.5" /></>
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div className="grid grid-cols-3 gap-2 border-t border-[var(--card-border)] bg-black/10 p-4">
          <div>
            <label className="text-[10px] uppercase text-[var(--grey)]" htmlFor={`poids-${exercice.id}`}>Poids (kg)</label>
            <input id={`poids-${exercice.id}`} type="number" step="0.5" inputMode="decimal" value={poids} onChange={(e) => setPoids(parseFloat(e.target.value) || 0)} className="w-full text-sm" />
          </div>
          <div>
            <label className="text-[10px] uppercase text-[var(--grey)]" htmlFor={`reps-${exercice.id}`}>Reps</label>
            <input id={`reps-${exercice.id}`} type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(parseInt(e.target.value) || 0)} className="w-full text-sm" />
          </div>
          <div>
            <label className="text-[10px] uppercase text-[var(--grey)]" htmlFor={`sets-${exercice.id}`}>Séries</label>
            <input id={`sets-${exercice.id}`} type="number" inputMode="numeric" value={sets} onChange={(e) => setSets(parseInt(e.target.value) || 0)} className="w-full text-sm" />
          </div>
          <input
            type="text" placeholder="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)}
            className="col-span-3 text-sm"
          />
          <Button onClick={enregistrer} disabled={saving} className="col-span-3 mt-1">
            {saving ? "Enregistrement…" : "Enregistrer la série"}
          </Button>
        </div>
      )}
    </Card>
  );
}
