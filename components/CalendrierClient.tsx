"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Minus } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];
const CELL_STYLES = [
  "bg-[var(--bg-card)]",
  "bg-[#2a2210]",
  "bg-[#3a2410]",
  "bg-[#4a2308] shadow-[0_0_8px_rgba(255,90,31,0.35)]",
];

export default function CalendrierClient() {
  const [flammes, setFlammes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  useEffect(() => {
    setLoading(true);
    fetch("/api/calendrier").then((r) => r.json()).then((data) => {
      setFlammes(data.flammesParJour ?? {});
      setLoading(false);
    });
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
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mois précédent">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-heading text-base font-bold uppercase tracking-wide capitalize">{label}</span>
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mois suivant">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1.5" aria-busy={loading}>
        {JOURS.map((j, i) => <div key={i} className="text-center text-[9px] uppercase text-[var(--grey)]">{j}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const niveau = flammes[iso] ?? 0;
          const isToday = iso === today;
          return (
            <Card
              key={i}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] ${CELL_STYLES[niveau]} ${isToday ? "border-[#FF5A1F]" : "border-transparent"}`}
            >
              {niveau === 0 ? (
                <Minus className="h-3 w-3 text-[var(--grey)]/50" aria-hidden="true" />
              ) : (
                <Flame className="h-3 w-3 text-[#FF5A1F]" fill="#FF5A1F" aria-hidden="true" />
              )}
              <span className="text-[var(--grey)]">{d}</span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
