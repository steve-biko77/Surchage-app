"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CalendarDays, TrendingUp, Gauge, Dumbbell, Repeat, Timer } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

type Exercice = { id: string; nom: string };

type Metrique = "poids" | "volume" | "reps" | "duree";

type PointProgression = {
  date: string;
  poids: number;
  reps: number;
  sets: number;
  dureeSecondes: number | null;
  volume: number;
  unRM: number | null;
};

type Data = {
  points: PointProgression[];
  metriquePrincipale: Metrique;
  auPoidsDuCorps: boolean;
  aDuree: boolean;
  deltas: { poids: number; volume: number; reps: number; duree: number };
  nbSeances: number;
  unRMMax: number | null;
};

const METRIQUE_LABEL: Record<Metrique, string> = {
  poids: "Poids",
  volume: "Volume",
  reps: "Répétitions",
  duree: "Durée",
};

function metriquesDisponibles(data: Data): Metrique[] {
  if (data.aDuree) return ["duree"];
  if (data.auPoidsDuCorps) return ["volume", "reps"];
  return ["poids", "volume", "reps"];
}

function valeurPourMetrique(p: PointProgression, metrique: Metrique): number {
  if (metrique === "poids") return p.poids;
  if (metrique === "volume") return p.volume;
  if (metrique === "reps") return p.reps;
  return p.dureeSecondes ?? 0;
}

function formatValeur(value: number, metrique: Metrique): string {
  if (metrique === "poids") return `${value}kg`;
  if (metrique === "duree") return `${value}s`;
  return `${value}`;
}

export default function ProgressionClient({ exercices }: { exercices: Exercice[] }) {
  const [selected, setSelected] = useState(exercices[0]?.id ?? "");
  const [data, setData] = useState<Data | null>(null);
  const [metrique, setMetrique] = useState<Metrique>("poids");

  useEffect(() => {
    if (!selected) return;
    setData(null);
    fetch(`/api/progression?exerciceId=${selected}`)
      .then((r) => r.json())
      .then((d: Data) => {
        setData(d);
        setMetrique(d.metriquePrincipale);
      });
  }, [selected]);

  const metriques = data ? metriquesDisponibles(data) : [];
  const chartData = data?.points.map((p) => ({ date: p.date, value: valeurPourMetrique(p, metrique) })) ?? [];
  const volumeTotal = data?.points.reduce((sum, p) => sum + p.volume, 0) ?? 0;
  const repsMax = data?.points.reduce((max, p) => Math.max(max, p.reps), 0) ?? 0;
  const dureeMax = data?.points.reduce((max, p) => Math.max(max, p.dureeSecondes ?? 0), 0) ?? 0;

  return (
    <div>
      <label className="sr-only" htmlFor="exo-select">Exercice</label>
      <select id="exo-select" value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full text-sm mb-4">
        {exercices.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
      </select>

      {data === null ? (
        <Card className="h-52 animate-pulse" aria-busy="true" aria-label="Chargement de la progression" />
      ) : data.points.length > 0 ? (
        <>
          {metriques.length > 1 && (
            <div className="flex gap-1.5 mb-3" role="tablist" aria-label="Métrique affichée">
              {metriques.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={metrique === m}
                  onClick={() => setMetrique(m)}
                  className={cn(
                    buttonVariants({ variant: "pill", size: "sm" }),
                    metrique === m && "border-[#FF5A1F] text-[#FF5A1F] bg-[#2a1c10]"
                  )}
                >
                  {METRIQUE_LABEL[m]}
                </button>
              ))}
            </div>
          )}
          <Card className="p-3">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#2a2c34" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#8b8d98", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2a2c34" }} />
                  <YAxis tick={{ fill: "#8b8d98", fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                  <Tooltip
                    contentStyle={{ background: "#17181e", border: "1px solid #3a3e4a", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#8b8d98" }}
                    formatter={(value) => [formatValeur(Number(value), metrique), METRIQUE_LABEL[metrique]]}
                  />
                  <Line type="monotone" dataKey="value" stroke="#FF5A1F" strokeWidth={2.5} dot={{ fill: "#FF5A1F", r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {data.aDuree ? (
              <>
                <StatTile icon={CalendarDays} value={data.nbSeances} label="Séances" />
                <StatTile icon={Timer} value={`${dureeMax}s`} label="Durée max" />
                <StatTile
                  icon={TrendingUp}
                  value={`${data.deltas.duree >= 0 ? "+" : ""}${data.deltas.duree}s`}
                  label="Depuis le début"
                  tone={data.deltas.duree > 0 ? "text-[var(--success)]" : data.deltas.duree < 0 ? "text-[var(--danger)]" : undefined}
                />
              </>
            ) : data.auPoidsDuCorps ? (
              <>
                <StatTile icon={CalendarDays} value={data.nbSeances} label="Séances" />
                <StatTile icon={Dumbbell} value={volumeTotal} label="Volume total" />
                <StatTile icon={Repeat} value={repsMax} label="Reps max" />
              </>
            ) : (
              <>
                <StatTile icon={CalendarDays} value={data.nbSeances} label="Séances" />
                <StatTile icon={Gauge} value={data.unRMMax != null ? `${data.unRMMax}kg` : "—"} label="1RM est." />
                <StatTile
                  icon={TrendingUp}
                  value={`${data.deltas.poids >= 0 ? "+" : ""}${data.deltas.poids}kg`}
                  label="Depuis le début"
                  tone={data.deltas.poids > 0 ? "text-[var(--success)]" : data.deltas.poids < 0 ? "text-[var(--danger)]" : undefined}
                />
              </>
            )}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[var(--grey)]">
            Pas encore assez de séances sur cet exercice.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof CalendarDays;
  value: string | number;
  label: string;
  tone?: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-1 py-3">
      <Icon className="h-3.5 w-3.5 text-[var(--grey)]" aria-hidden="true" />
      <div className={`font-heading text-lg font-black leading-none ${tone ?? ""}`}>{value}</div>
      <div className="text-[10px] uppercase text-[var(--grey)]">{label}</div>
    </Card>
  );
}
