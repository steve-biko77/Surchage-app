export const dynamic = "force-dynamic";
import Link from "next/link";
import { tachesRepository } from "@/lib/adapters/repositories";
import { todayISO, decalerDate, debutSemaine } from "@/lib/domain/services";
import { IconChevronLeft, IconChevronRight, IconWeek, IconCheck } from "@/components/icons";

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
  const debutLabel = new Date(debut + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const finLabel = new Date(fin + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  const total = taches.length;
  const faites = taches.filter((t) => t.fait).length;
  const pct = total > 0 ? Math.round((faites / total) * 100) : 0;
  const semaineCourante = debut === debutSemaine(today);

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Semaine</h1>
          <p className="page-sub">
            Du {debutLabel} au {finLabel}
            {semaineCourante ? " · semaine en cours" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href={`/semaine?date=${decalerDate(debut, -7)}`} className="btn btn-icon" aria-label="Semaine précédente">
            <IconChevronLeft />
          </Link>
          {!semaineCourante && (
            <Link href="/semaine" className="btn">
              Cette semaine
            </Link>
          )}
          <Link href={`/semaine?date=${decalerDate(debut, 7)}`} className="btn btn-icon" aria-label="Semaine suivante">
            <IconChevronRight />
          </Link>
        </div>
      </header>

      <section className="panel panel-hero panel-pad-lg spot" style={{ marginBottom: 16 }}>
        <div className="panel-head" style={{ marginBottom: 14 }}>
          <div className="chip">
            <IconWeek />
          </div>
          <div className="ph-text">
            <h2>Vue d&apos;ensemble</h2>
            <p>
              {faites} tâche{faites > 1 ? "s" : ""} cochée{faites > 1 ? "s" : ""} sur {total}
            </p>
          </div>
          <div className="ph-right">
            <span className={`delta ${pct >= 70 ? "up" : pct >= 30 ? "flat" : "down"}`}>{pct}%</span>
          </div>
        </div>
        <div className="meter-track" style={{ height: 8 }}>
          <div className={`meter-fill ${pct >= 100 ? "teal" : ""}`} style={{ width: `${pct}%` }} />
        </div>
      </section>

      <div className="week-grid">
        {jours.map((jour) => {
          const jourTaches = taches.filter((t) => t.date === jour);
          const jFaites = jourTaches.filter((t) => t.fait).length;
          const jPct = jourTaches.length ? Math.round((jFaites / jourTaches.length) * 100) : 0;
          const dt = new Date(jour + "T00:00:00");
          const nom = dt.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
          const mois = dt.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
          const complet = jourTaches.length > 0 && jFaites === jourTaches.length;

          return (
            <Link href={`/jour?date=${jour}`} key={jour} className={`week-day ${jour === today ? "today" : ""}`}>
              <div>
                <div className="wd-name">{nom}</div>
                <div className="wd-date">{dt.getDate()}</div>
                <div className="wd-month">{mois}</div>
              </div>
              <div className="wd-foot">
                <div className="wd-count" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {complet && <IconCheck style={{ width: 11, height: 11, color: "var(--teal)" }} />}
                  {jourTaches.length === 0 ? "—" : `${jFaites}/${jourTaches.length}`}
                </div>
                <div className="wd-bar">
                  <div className={`wd-bar-fill ${complet ? "full" : ""}`} style={{ width: `${jPct}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
