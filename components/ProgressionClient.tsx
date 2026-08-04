"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CalendarDays, TrendingUp, Gauge } from "lucide-react";
import { Card, CardContent } from "./ui/card";

type Exercice = { id: string; nom: string };
type Point = { date: string; poids: number; reps: number; sets: number; unRM: number | null };
type Data = { courbe: Point[]; unRMMax: number | null; delta: number; nbSeances: number };

export default function ProgressionClient({ exercices }: { exercices: Exercice[] }) {
  const [selected, setSelected] = useState(exercices[0]?.id ?? "");
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    if (!selected) return;
    setData(null);
    fetch(`/api/progression?exerciceId=${selected}`).then((r) => r.json()).then(setData);
  }, [selected]);

  return (
    <div>
      <label className="sr-only" htmlFor="exo-select">Exercice</label>
      <select id="exo-select" value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full text-sm mb-4">
        {exercices.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
      </select>

      {data === null ? (
        <Card className="h-52 animate-pulse" aria-busy="true" aria-label="Chargement de la progression" />
      ) : data.courbe.length > 0 ? (
        <>
          <Card className="p-3">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.courbe} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#2a2c34" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#8b8d98", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2a2c34" }} />
                  <YAxis tick={{ fill: "#8b8d98", fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                  <Tooltip
                    contentStyle={{ background: "#17181e", border: "1px solid #3a3e4a", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#8b8d98" }}
                    formatter={(value) => [`${value}kg`, "Poids"]}
                  />
                  <Line type="monotone" dataKey="poids" stroke="#FF5A1F" strokeWidth={2.5} dot={{ fill: "#FF5A1F", r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatTile icon={CalendarDays} value={data.nbSeances} label="Séances" />
            <StatTile icon={Gauge} value={data.unRMMax != null ? `${data.unRMMax}kg` : "—"} label="1RM est." />
            <StatTile
              icon={TrendingUp}
              value={`${data.delta >= 0 ? "+" : ""}${data.delta}kg`}
              label="Depuis le début"
              tone={data.delta > 0 ? "text-[var(--success)]" : data.delta < 0 ? "text-[var(--danger)]" : undefined}
            />
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
