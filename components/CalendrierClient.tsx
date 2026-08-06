"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Minus, CalendarClock } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { todayISO } from "@/lib/domain/services";

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];
const JOURS_COURTS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const CELL_STYLES = [
  "bg-[var(--bg-card)]",
  "bg-[#2a2210]",
  "bg-[#3a2410]",
  "bg-[#4a2308] shadow-[0_0_8px_rgba(255,90,31,0.35)]",
];

type SeancePlanifiee = { id: string; date: string; nom: string; statut: "planifiee" | "realisee" };

/**
 * Avance en arithmetique UTC pure a partir d'une date ISO deja resolue en heure
 * locale France (todayISO) - cf. bug H, aucune conversion de fuseau supplementaire
 * n'entre en jeu ensuite donc pas de risque de decalage sur les jours suivants.
 */
function addJoursISO(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + n);
  return date;
}
/** Compose une date ISO a partir de composants calendaires locaux, sans passer par toISOString (evite toute conversion de fuseau parasite sur une date "murale" pure). */
function isoFromYMD(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendrierClient() {
  const [flammes, setFlammes] = useState<Record<string, number>>({});
  const [planifiees, setPlanifiees] = useState<SeancePlanifiee[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = todayISO();
  const dansQuatorzeJours = addJoursISO(today, 13).toISOString().slice(0, 10);
  const dernierJourDuMois = new Date(year, month + 1, 0).getDate();
  const finDuMois = isoFromYMD(year, month + 1, dernierJourDuMois);
  const debutDuMois = isoFromYMD(year, month + 1, 1);

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
    const d = addJoursISO(today, i);
    return { iso: d.toISOString().slice(0, 10), label: JOURS_COURTS[d.getUTCDay()], numero: d.getUTCDate(), estAujourdhui: i === 0 };
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
