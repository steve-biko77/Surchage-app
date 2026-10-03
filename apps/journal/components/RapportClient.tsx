"use client";
import { useRouter } from "next/navigation";

type RapportDiscipline = { id: string; nom: string; icone: string; joursValides: number; streak: number };
type RapportObjectif = { id: string; nom: string; unite: string; progression: number };
type Rapport = {
  dateDebut: string;
  dateFin: string;
  pourcentageTachesFaites: number;
  disciplines: RapportDiscipline[];
  objectifs: RapportObjectif[];
  joursEngages: number;
  joursTotal: number;
};

export default function RapportClient({ periode, rapport }: { periode: number; rapport: Rapport }) {
  const router = useRouter();

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
        <div className="obj-card">
          <div className="obj-top">
            <div className="obj-name">Tâches cochées</div>
          </div>
          <div className="obj-bar-bg"><div className="obj-bar-fill" style={{ width: `${rapport.pourcentageTachesFaites}%` }} /></div>
          <div className="obj-meta">
            <span>{rapport.pourcentageTachesFaites}% du total sur la période</span>
          </div>
        </div>
        <div className="obj-card">
          <div className="obj-top">
            <div className="obj-name">Jours avec au moins une action</div>
          </div>
          <div className="obj-bar-bg">
            <div
              className="obj-bar-fill"
              style={{ width: `${rapport.joursTotal > 0 ? Math.round((rapport.joursEngages / rapport.joursTotal) * 100) : 0}%` }}
            />
          </div>
          <div className="obj-meta">
            <span>{rapport.joursEngages} / {rapport.joursTotal} jours (tâches ou disciplines)</span>
          </div>
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
