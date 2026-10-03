"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RapportDiscipline = { id: string; nom: string; icone: string; joursValides: number; streak: number };
type RapportObjectif = { id: string; nom: string; unite: string; progression: number };
type RapportJourSerie = { date: string; pourcentage: number; engage: boolean };
type Rapport = {
  dateDebut: string;
  dateFin: string;
  pourcentageTachesFaites: number;
  disciplines: RapportDiscipline[];
  objectifs: RapportObjectif[];
  joursEngages: number;
  joursTotal: number;
  serieJournaliere: RapportJourSerie[];
};

/** Anneau de progression animé (SVG) — le tracé se dessine au montage. */
function ProgressRing({ value, color, size = 86 }: { value: number; color: string; size?: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (animated ? value : 0) / 100 * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(238,241,251,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }}
      />
    </svg>
  );
}

function jourLabel(iso: string, periode: number): string {
  const d = new Date(iso + "T00:00:00");
  return periode === 7
    ? d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2)
    : String(d.getDate());
}

export default function RapportClient({ periode, rapport }: { periode: number; rapport: Rapport }) {
  const router = useRouter();
  const joursPct = rapport.joursTotal > 0 ? Math.round((rapport.joursEngages / rapport.joursTotal) * 100) : 0;

  return (
    <>
      <div className="card">
        <h2>Période</h2>
        <div className="mode-toggle" role="radiogroup" aria-label="Periode du rapport">
          <button className={`mode-btn ${periode === 7 ? "active" : ""}`} onClick={() => router.push("/rapport?periode=7")}>
            7 derniers jours
          </button>
          <button className={`mode-btn ${periode === 30 ? "active" : ""}`} onClick={() => router.push("/rapport?periode=30")}>
            30 derniers jours
          </button>
        </div>
        <div className="obj-meta">
          <span>Du {rapport.dateDebut} au {rapport.dateFin}</span>
        </div>
      </div>

      <div className="card">
        <h2>Engagement</h2>
        <div className="dash-grid">
          <div className="dash-stat">
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ProgressRing value={rapport.pourcentageTachesFaites} color="var(--dawn)" />
              <div style={{ position: "absolute" }} className="ring-value">{rapport.pourcentageTachesFaites}%</div>
            </div>
            <div className="ring-label">Tâches cochées sur la période</div>
          </div>
          <div className="dash-stat">
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ProgressRing value={joursPct} color="var(--aurora)" />
              <div style={{ position: "absolute" }} className="ring-value">{joursPct}%</div>
            </div>
            <div className="ring-label">{rapport.joursEngages} / {rapport.joursTotal} jours actifs</div>
          </div>
        </div>

        <h2 style={{ marginTop: 20 }}>Activité jour par jour</h2>
        <div className="bar-chart">
          {rapport.serieJournaliere.map((j) => (
            <div className="bar-col" key={j.date} title={`${j.date} — ${j.pourcentage}%`}>
              <div className="bar-track">
                <div
                  className={`bar-fill ${j.engage ? "engaged" : ""}`}
                  style={{ height: `${j.engage ? Math.max(j.pourcentage, 8) : j.pourcentage}%` }}
                />
              </div>
              <div className="bar-day">{jourLabel(j.date, periode)}</div>
            </div>
          ))}
        </div>
        <div className="legend-row">
          <span><span className="legend-dot" style={{ background: "var(--aurora)" }} />jour actif</span>
          <span><span className="legend-dot" style={{ background: "var(--dawn)" }} />% tâches cochées</span>
        </div>
      </div>

      <div className="card">
        <h2>Disciplines</h2>
        {rapport.disciplines.length === 0 && <div className="empty">Aucune discipline.</div>}
        {rapport.disciplines.map((d) => (
          <div className="obj-card" key={d.id}>
            <div className="obj-top">
              <div className="obj-name">{d.icone} {d.nom}</div>
            </div>
            <div className="obj-meta">
              <span>{d.joursValides} jour{d.joursValides > 1 ? "s" : ""} validé{d.joursValides > 1 ? "s" : ""} sur la période</span>
              <span>🔥 streak {d.streak}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Objectifs</h2>
        {rapport.objectifs.length === 0 && <div className="empty">Aucun objectif.</div>}
        {rapport.objectifs.map((o) => (
          <div className="obj-card" key={o.id}>
            <div className="obj-top">
              <div className="obj-name">{o.nom}</div>
            </div>
            <div className="obj-bar-bg"><div className="obj-bar-fill" style={{ width: `${o.progression}%` }} /></div>
            <div className="obj-meta">
              <span>{o.unite}</span>
              <span>{o.progression}%</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
