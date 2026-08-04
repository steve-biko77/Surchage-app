"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Minus, CalendarClock } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];
const JOURS_COURTS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const CELL_STYLES = [
  "bg-[var(--bg-card)]",
  "bg-[#2a2210]",
  "bg-[#3a2410]",
  "bg-[#4a2308] shadow-[0_0_8px_rgba(255,90,31,0.35)]",
];

type SeancePlanifiee = { id: string; date: string; nom: string; statut: "planifiee" | "realisee" };

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(base.getDate() + n);
  return d;
}
function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendrierClient() {
  const [flammes, setFlammes] = useState<Record<string, number>>({});
  const [planifiees, setPlanifiees] = useState<SeancePlanifiee[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = toISO(new Date());
  const dansQuatorzeJours = toISO(addDays(new Date(), 13));
  const finDuMois = toISO(new Date(year, month + 1, 0));
  const debutDuMois = toISO(new Date(year, month, 1));

  useEffect(() => {
    setLoading(true);
    const from = debutDuMois < today ? debutDuMois : today;
    const to = finDuMois > dansQuatorzeJours ? finDuMois : dansQuatorzeJours;
    Promise.all([
      fetch("/api/calendrier").then((r) => r.json()),
      fetch(`/api/seances-planifiees?from=${from}&to=${to}`).then((r) => r.json()),
    ]).then(([cal, seances]) => {
      setFlammes(cal.flammesParJour ?? {});
      setPlanifiees(Array.isArray(seances) ? seances : []);
      setLoading(false);
    });
  }, [debutDuMois, finDuMois, today, dansQuatorzeJours]);

  const planifieeParJour: Record<string, SeancePlanifiee> = {};
  for (const s of planifiees) {
    if (s.statut === "planifiee") planifieeParJour[s.date] = s;
  }

  const label = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay() - 1; if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const prochains = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    const iso = toISO(d);
    return { iso, label: JOURS_COURTS[d.getDay()], numero: d.getDate(), estAujourdhui: i === 0 };
  });

  return (
    <div>
      <div className="mb-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--grey)]">14 prochains jours</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {prochains.map((j) => {
            const niveau = flammes[j.iso] ?? 0;
            const planifiee = planifieeParJour[j.iso];
            return (
              <div
                key={j.iso}
                title={planifiee ? planifiee.nom : undefined}
                className={`flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-[10px] ${
                  niveau > 0 ? CELL_STYLES[niveau] : "bg-[var(--bg-card)]"
                } ${planifiee ? "border-dashed border-[#3B82C4]" : j.estAujourdhui ? "border-[#FF5A1F]/60" : "border-[var(--card-border)]"}`}
              >
                {niveau > 0 ? (
                  <Flame className="h-3 w-3 text-[#FF5A1F]" fill="#FF5A1F" aria-hidden="true" />
                ) : planifiee ? (
                  <CalendarClock className="h-3 w-3 text-[#3B82C4]" aria-hidden="true" />
                ) : (
                  <Minus className="h-3 w-3 text-[var(--grey)]/50" aria-hidden="true" />
                )}
                <span className="uppercase text-[var(--grey)]">{j.label}</span>
                <span className="font-heading font-bold">{j.numero}</span>
              </div>
            );
          })}
        </div>
      </div>

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
          const planifiee = planifieeParJour[iso];
          const isToday = iso === today;
          return (
            <Card
              key={i}
              title={planifiee ? planifiee.nom : undefined}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] ${
                niveau > 0 ? CELL_STYLES[niveau] : "bg-[var(--bg-card)]"
              } ${planifiee ? "border-dashed border-[#3B82C4]" : isToday ? "border-[#FF5A1F]" : "border-transparent"}`}
            >
              {niveau > 0 ? (
                <Flame className="h-3 w-3 text-[#FF5A1F]" fill="#FF5A1F" aria-hidden="true" />
              ) : planifiee ? (
                <CalendarClock className="h-3 w-3 text-[#3B82C4]" aria-hidden="true" />
              ) : (
                <Minus className="h-3 w-3 text-[var(--grey)]/50" aria-hidden="true" />
              )}
              <span className="text-[var(--grey)]">{d}</span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
