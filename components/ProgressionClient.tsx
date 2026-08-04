"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Exercice = { id: string; nom: string };

export default function ProgressionClient({ exercices }: { exercices: Exercice[] }) {
  const [selected, setSelected] = useState(exercices[0]?.id ?? "");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/progression?exerciceId=${selected}`).then((r) => r.json()).then(setData);
  }, [selected]);

  return (
    <div>
      <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full text-sm mb-4">
        {exercices.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
      </select>

      {data && data.courbe?.length > 0 ? (
        <>
          <div className="h-52 bg-[#1b1d23] rounded-xl border border-[#2a2c34] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.courbe}>
                <CartesianGrid stroke="#2a2c34" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#8b8d98", fontSize: 10 }} />
                <YAxis tick={{ fill: "#8b8d98", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1b1d23", border: "1px solid #3a3e4a", fontSize: 12 }} />
                <Line type="monotone" dataKey="poids" stroke="#FF5A1F" strokeWidth={2} dot={{ fill: "#FF5A1F", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 mt-4">
            <div className="flex-1 text-center bg-[#1b1d23] rounded-lg border border-[#2a2c34] py-3">
              <div className="text-lg font-black">{data.nbSeances}</div>
              <div className="text-[10px] text-[#8b8d98] uppercase">Séances</div>
            </div>
            <div className="flex-1 text-center bg-[#1b1d23] rounded-lg border border-[#2a2c34] py-3">
              <div className="text-lg font-black">{data.unRMMax ?? "—"}kg</div>
              <div className="text-[10px] text-[#8b8d98] uppercase">1RM est. max</div>
            </div>
            <div className="flex-1 text-center bg-[#1b1d23] rounded-lg border border-[#2a2c34] py-3">
              <div className="text-lg font-black">{data.delta >= 0 ? "+" : ""}{data.delta}kg</div>
              <div className="text-[10px] text-[#8b8d98] uppercase">Depuis le début</div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-[#8b8d98] text-center py-10">Pas encore assez de séances sur cet exercice.</p>
      )}
    </div>
  );
}
