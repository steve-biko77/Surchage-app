"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

type TypeObjectif = "temps" | "performance";

type Objectif = {
  id: string;
  nom: string;
  heuresCible: number;
  minutesInvesties: number;
  deadline: string | null;
  type: TypeObjectif;
  exerciceIds: string[];
  poidsCible: number | null;
  progressionPerformance: number | null;
  meilleurPoids: number | null;
};

type Exercice = { id: string; nom: string };

export default function ObjectifsClient({
  initialObjectifs,
  exercices,
}: {
  initialObjectifs: Objectif[];
  exercices: Exercice[];
}) {
  const router = useRouter();
  const [type, setType] = useState<TypeObjectif>("temps");
  const [nom, setNom] = useState("");
  const [heures, setHeures] = useState(50);
  const [deadline, setDeadline] = useState("");
  const [exerciceIds, setExerciceIds] = useState<string[]>([]);
  const [poidsCible, setPoidsCible] = useState(50);
  const [saving, setSaving] = useState(false);

  function toggleExercice(id: string) {
    setExerciceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function creer() {
    if (!nom) return;
    if (type === "temps" && !heures) return;
    if (type === "performance" && (exerciceIds.length === 0 || !poidsCible)) return;

    setSaving(true);
    await fetch("/api/objectifs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        type === "temps"
          ? { nom, disciplineId: null, heuresCible: heures, deadline: deadline || null, type }
          : { nom, disciplineId: null, deadline: deadline || null, type, exerciceIds, poidsCible }
      ),
    });
    setNom("");
    setHeures(50);
    setDeadline("");
    setPoidsCible(50);
    setExerciceIds([]);
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
        <p className="mb-4 text-sm text-[var(--grey)]">Aucun objectif pour l&apos;instant.</p>
      )}

      {initialObjectifs.map((o) => {
        if (o.type === "performance") {
          const nomsExercices = o.exerciceIds
            .map((id) => exercices.find((e) => e.id === id)?.nom)
            .filter(Boolean)
            .join(", ");
          const pct = o.progressionPerformance ?? 0;
          const atteint = pct >= 100;
          return (
            <Card key={o.id} className="mb-3">
              <CardContent className="pt-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#3B82C4]" aria-hidden="true" />
                      <h3 className="truncate font-heading font-bold">{o.nom}</h3>
                    </div>
                    <p className="truncate text-[10px] uppercase tracking-wide text-[var(--grey)]">{nomsExercices || "Exercice"}</p>
                  </div>
                  {atteint ? (
                    <Badge variant="success"><Sparkles className="h-3 w-3" />Atteint</Badge>
                  ) : (
                    o.deadline && <span className="shrink-0 text-[10px] text-[var(--grey)]">échéance {o.deadline}</span>
                  )}
                </div>
                <Progress value={pct} indicatorClassName="from-[#2a5f8f] to-[#3B82C4]" />
                <div className="mt-2 flex justify-between text-xs text-[var(--grey)]">
                  <span>{o.meilleurPoids ?? 0}kg / {o.poidsCible}kg</span>
                  <span className="font-medium text-[var(--chalk)]">{pct}%</span>
                </div>
                <p className="mt-2 text-[10px] text-[var(--grey)]">Progression calculée automatiquement à chaque nouvelle série.</p>
              </CardContent>
            </Card>
          );
        }

        const pct = o.heuresCible > 0 ? Math.min(100, Math.round((o.minutesInvesties / 60 / o.heuresCible) * 100)) : 0;
        return (
          <Card key={o.id} className="mb-3">
            <CardContent className="pt-4">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#FF5A1F]" aria-hidden="true" />
                  <h3 className="truncate font-heading font-bold">{o.nom}</h3>
                </div>
                {o.deadline && <span className="shrink-0 text-[10px] text-[var(--grey)]">échéance {o.deadline}</span>}
              </div>
              <Progress value={pct} />
              <div className="mt-2 mb-3 flex justify-between text-xs text-[var(--grey)]">
                <span>{Math.round((o.minutesInvesties / 60) * 10) / 10} / {o.heuresCible}h</span>
                <span className="font-medium text-[var(--chalk)]">{pct}%</span>
              </div>
              <div className="flex gap-2">
                {[15, 30, 60].map((m) => (
                  <Button key={m} variant="pill" size="sm" onClick={() => ajouterMinutes(o.id, m)}>
                    +{m < 60 ? `${m}min` : "1h"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className="mt-6 border-[#3B82C4]/40">
        <CardContent className="pt-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#3B82C4]">Nouvel objectif</h3>

          <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type d'objectif">
            <button
              type="button"
              role="radio"
              aria-checked={type === "temps"}
              onClick={() => setType("temps")}
              className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-medium transition-colors duration-150 ${type === "temps" ? "border-[#FF5A1F] bg-[#2a1c10] text-[#FF5A1F]" : "border-[var(--steel)] text-[var(--grey)] hover:text-[var(--chalk)]"}`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Temps
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={type === "performance"}
              onClick={() => setType("performance")}
              className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-medium transition-colors duration-150 ${type === "performance" ? "border-[#3B82C4] bg-[#122233] text-[#3B82C4]" : "border-[var(--steel)] text-[var(--grey)] hover:text-[var(--chalk)]"}`}
            >
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> Performance
            </button>
          </div>

          <label className="sr-only" htmlFor="obj-nom">Nom de l&apos;objectif</label>
          <input id="obj-nom" placeholder="Nom de l'objectif" value={nom} onChange={(e) => setNom(e.target.value)} className="mb-2 w-full text-sm" />

          {type === "temps" ? (
            <div className="mb-3 flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase text-[var(--grey)]" htmlFor="obj-heures">Heures visées</label>
                <input id="obj-heures" type="number" inputMode="decimal" value={heures} onChange={(e) => setHeures(parseFloat(e.target.value) || 0)} className="w-full text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase text-[var(--grey)]" htmlFor="obj-deadline">Échéance</label>
                <input id="obj-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full text-sm" />
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <label className="text-[10px] uppercase text-[var(--grey)]">Exercices liés (un ou plusieurs)</label>
              <div className="mb-2 max-h-36 overflow-y-auto rounded-lg border border-[var(--steel)] p-1.5">
                {exercices.length === 0 && <p className="p-2 text-xs text-[var(--grey)]">Aucun exercice</p>}
                {exercices.map((e) => {
                  const checked = exerciceIds.includes(e.id);
                  return (
                    <label
                      key={e.id}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${checked ? "bg-[#122233] text-[#3B82C4]" : "text-[var(--chalk)]"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExercice(e.id)}
                        className="h-4 w-4 shrink-0 accent-[#3B82C4]"
                        style={{ minHeight: 0 }}
                      />
                      {e.nom}
                    </label>
                  );
                })}
              </div>
              <label className="text-[10px] uppercase text-[var(--grey)]" htmlFor="obj-poids">Poids cible (kg)</label>
              <input id="obj-poids" type="number" step="0.5" inputMode="decimal" value={poidsCible} onChange={(e) => setPoidsCible(parseFloat(e.target.value) || 0)} className="w-full text-sm" />
            </div>
          )}

          <Button onClick={creer} disabled={saving} variant="secondary" className="w-full">
            {saving ? "Création…" : "Créer l'objectif"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
