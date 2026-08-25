export const dynamic = "force-dynamic";
import Link from "next/link";
import { tachesRepository } from "@/lib/adapters/repositories";
import { todayISO, decalerDate, debutSemaine } from "@/lib/domain/services";

export default async function SemainePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const ref = dateParam || todayISO();
  const debut = debutSemaine(ref);
  const fin = decalerDate(debut, 6);
  const today = todayISO();

  const taches = await tachesRepository.entreDates(debut, fin);

  const jours = Array.from({ length: 7 }, (_, i) => decalerDate(debut, i));
  const debutLabel = new Date(debut + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const finLabel = new Date(fin + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <div className="card">
      <div className="day-nav">
        <Link href={`/semaine?date=${decalerDate(debut, -7)}`}><button>‹</button></Link>
        <div className="day-label">{debutLabel} – {finLabel}</div>
        <Link href={`/semaine?date=${decalerDate(debut, 7)}`}><button>›</button></Link>
      </div>

      <div className="week-grid">
        {jours.map((jour) => {
          const jourTaches = taches.filter((t) => t.date === jour);
          const faites = jourTaches.filter((t) => t.fait).length;
          const pct = jourTaches.length ? Math.round((faites / jourTaches.length) * 100) : 0;
          const nom = new Date(jour + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long" });
          const dateLabel = new Date(jour + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
          return (
            <Link href={`/jour?date=${jour}`} key={jour} className={`week-day ${jour === today ? "today" : ""}`}>
              <div>
                <div className="wd-name">{nom}</div>
                <div className="wd-date">{dateLabel}</div>
              </div>
              <div className="wd-stats">
                <span className="wd-count">{faites}/{jourTaches.length}</span>
                <div className="wd-bar"><div className="wd-bar-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
