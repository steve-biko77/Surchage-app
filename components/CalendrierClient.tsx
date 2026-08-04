"use client";
import { useEffect, useState } from "react";

const FLAME_ICON = ["—", "🔥", "🔥🔥", "🔥🔥🔥"];
const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

export default function CalendrierClient() {
  const [flammes, setFlammes] = useState<Record<string, number>>({});
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  useEffect(() => {
    fetch("/api/calendrier").then((r) => r.json()).then((data) => setFlammes(data.flammesParJour ?? {}));
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const label = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay() - 1; if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="w-8 h-8 rounded bg-[#22242c] border border-[#3a3e4a]">‹</button>
        <span className="text-sm font-bold uppercase tracking-wide capitalize">{label}</span>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="w-8 h-8 rounded bg-[#22242c] border border-[#3a3e4a]">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {JOURS.map((j, i) => <div key={i} className="text-center text-[9px] text-[#8b8d98] uppercase">{j}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const niveau = flammes[iso] ?? 0;
          const isToday = iso === today;
          return (
            <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] ${niveau === 3 ? "bg-[#4a2308] shadow-[0_0_8px_rgba(255,90,31,0.35)]" : niveau === 2 ? "bg-[#3a2410]" : niveau === 1 ? "bg-[#2a2210]" : "bg-[#1b1d23]"} ${isToday ? "border border-[#FF5A1F]" : ""}`}>
              <span>{FLAME_ICON[niveau]}</span>
              <span className="text-[#8b8d98]">{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
