"use client";
import { useRouter } from "next/navigation";
import { GaugeArc, RadarChart, AreaChart, ProgressRing, MiniSpark, CountUp } from "./charts";
import Segmented from "./Segmented";
import { IconChart, IconFlame, IconTarget, IconSparkle, IconEye, IconCheck, IconSun, IconLayers } from "./icons";

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

function lectureDuScore(score: number): { titre: string; texte: string } {
  if (score >= 80)
    return {
      titre: "Rythme installé",
      texte: "Tu tiens la cadence sur la quasi-totalité de la période. À ce stade, l'enjeu n'est plus la régularité mais le niveau d'exigence que tu te fixes.",
    };
  if (score >= 60)
    return {
      titre: "Bonne dynamique",
      texte: "La base tient. Les trous sont ponctuels plutôt que structurels — identifie les deux ou trois jours qui décrochent et tu passes un palier.",
    };
  if (score >= 40)
    return {
      titre: "En construction",
      texte: "Le socle existe mais la régularité reste fragile. Viser moins d'engagements et les tenir tous vaut mieux qu'une liste ambitieuse à moitié cochée.",
    };
  if (score >= 20)
    return {
      titre: "Irrégulier",
      texte: "Les journées actives sont encore isolées. Commence par une seule discipline tenue tous les jours : la régularité se construit sur un point d'ancrage, pas sur un front large.",
    };
  return {
    titre: "Démarrage",
    texte: "Peu de données sur la période. Coche ne serait-ce qu'une tâche par jour pendant une semaine, et ce rapport commencera à dire quelque chose d'utile.",
  };
}

function formatJour(iso: string, periode: number): string {
  const d = new Date(iso + "T00:00:00");
  return periode === 7
    ? d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "").slice(0, 3)
    : String(d.getDate());
}

function formatDateCourte(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function RapportClient({ periode, rapport }: { periode: number; rapport: Rapport }) {
  const router = useRouter();

  const joursPct = rapport.joursTotal > 0 ? Math.round((rapport.joursEngages / rapport.joursTotal) * 100) : 0;

  const disciplinePct = (d: RapportDiscipline) =>
    rapport.joursTotal > 0 ? Math.round((d.joursValides / rapport.joursTotal) * 100) : 0;

  const moyenneDisciplines =
    rapport.disciplines.length > 0
      ? Math.round(rapport.disciplines.reduce((s, d) => s + disciplinePct(d), 0) / rapport.disciplines.length)
      : 0;

  const moyenneObjectifs =
    rapport.objectifs.length > 0
      ? Math.round(rapport.objectifs.reduce((s, o) => s + o.progression, 0) / rapport.objectifs.length)
      : 0;

  // Score composite assumé : moitié « est-ce que je fais ce que je prévois »,
  // moitié « est-ce que je montre le nez tous les jours ».
  const score = Math.round(rapport.pourcentageTachesFaites * 0.5 + joursPct * 0.5);
  const lecture = lectureDuScore(score);

  // Une seule couleur pour les quatre barres : la couleur n'encode rien ici,
  // c'est la longueur qui porte l'information. Quatre teintes différentes
  // feraient croire à quatre natures différentes.
  const categories = [
    { nom: "Tâches cochées", valeur: rapport.pourcentageTachesFaites, brut: `${rapport.pourcentageTachesFaites}%` },
    { nom: "Jours actifs", valeur: joursPct, brut: `${rapport.joursEngages}/${rapport.joursTotal}` },
    { nom: "Disciplines tenues", valeur: moyenneDisciplines, brut: `${moyenneDisciplines}%` },
    { nom: "Objectifs avancés", valeur: moyenneObjectifs, brut: `${moyenneObjectifs}%` },
  ];

  const classees = [...categories].sort((a, b) => b.valeur - a.valeur);
  const forts = classees.filter((c) => c.valeur > 0).slice(0, 2);
  const faibles = classees.slice(-2).reverse().filter((c) => !forts.includes(c));

  const meilleurStreak = rapport.disciplines.reduce<RapportDiscipline | null>(
    (best, d) => (best === null || d.streak > best.streak ? d : best),
    null
  );

  const serieChart = rapport.serieJournaliere.map((j) => ({
    label: formatJour(j.date, periode),
    value: j.pourcentage,
    engage: j.engage,
  }));

  const sparkTaches = rapport.serieJournaliere.map((j) => j.pourcentage);
  const sparkJours = rapport.serieJournaliere.map((j) => (j.engage ? 1 : 0));

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Rapport</h1>
          <p className="page-sub">
            Du {formatDateCourte(rapport.dateDebut)} au {formatDateCourte(rapport.dateFin)} · {rapport.joursTotal} jours
          </p>
        </div>
        <Segmented
          ariaLabel="Période du rapport"
          value={periode === 30 ? "30" : "7"}
          onChange={(v) => router.push(`/rapport?periode=${v}`)}
          options={[
            { value: "7", label: "7 jours" },
            { value: "30", label: "30 jours" },
          ]}
        />
      </header>

      {/* ─── Vue d'ensemble ─── */}
      <div className="grid g-main g-stretch" style={{ marginBottom: 16 }}>
        <section className="panel panel-hero panel-pad-lg spot">
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <div className="eyebrow">Lecture de la période</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: "8px 0 10px" }}>
                {lecture.titre}
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: "44ch" }}>
                {lecture.texte}
              </p>
              <p style={{ margin: "14px 0 0", fontSize: 11.5, color: "var(--ink-4)", lineHeight: 1.5, maxWidth: "46ch" }}>
                Indice calculé pour moitié sur les tâches cochées, pour moitié sur les jours où tu as fait
                quelque chose. Il mesure la régularité, pas la valeur de ce que tu fais.
              </p>
            </div>
            <div style={{ flex: "0 1 250px", display: "grid", placeItems: "center" }}>
              <GaugeArc value={score} label={`${score}%`} caption="Indice de régularité" />
            </div>
          </div>
        </section>

        <section className="panel panel-pad-lg spot">
          <div className="panel-head">
            <div className="chip">
              <IconLayers />
            </div>
            <div className="ph-text">
              <h2>Scores par catégorie</h2>
              <p>Plus la barre est pleine, plus c&apos;est tenu</p>
            </div>
          </div>
          {categories.map((c, i) => (
            <div className="meter" key={c.nom}>
              <div className="meter-head">
                <span className="meter-name">{c.nom}</span>
                <span className="meter-value">{c.brut}</span>
              </div>
              <div className="meter-track">
                <div className="meter-fill" style={{ width: `${c.valeur}%`, animationDelay: `${i * 90}ms` }} />
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* ─── Points forts / à surveiller ─── */}
      {(forts.length > 0 || faibles.length > 0) && (
        <div className="grid g-2" style={{ marginBottom: 16 }}>
          <section className="panel panel-accent-teal spot">
            <div className="panel-head">
              <div className="chip teal">
                <IconCheck />
              </div>
              <div className="ph-text">
                <h2>Points forts</h2>
                <p>Ce qui tient tout seul</p>
              </div>
            </div>
            {forts.length === 0 ? (
              <div className="empty" style={{ padding: "12px 0" }}>
                Rien de marquant sur cette période.
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                {forts.map((c) => (
                  <li key={c.nom} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5 }}>
                    <span style={{ color: "var(--teal)", display: "grid", placeItems: "center", width: 16, height: 16 }}>
                      <IconCheck style={{ width: 14, height: 14 }} />
                    </span>
                    {c.nom}
                    <span className="delta up" style={{ marginLeft: "auto" }}>{c.valeur}%</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel panel-accent-amber spot">
            <div className="panel-head">
              <div className="chip amber">
                <IconEye />
              </div>
              <div className="ph-text">
                <h2>À surveiller</h2>
                <p>Là où ça décroche en premier</p>
              </div>
            </div>
            {faibles.length === 0 ? (
              <div className="empty" style={{ padding: "12px 0" }}>
                Rien d&apos;alarmant sur cette période.
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                {faibles.map((c) => (
                  <li key={c.nom} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5 }}>
                    <span style={{ color: "var(--amber)", display: "grid", placeItems: "center", width: 16, height: 16 }}>
                      <IconEye style={{ width: 14, height: 14 }} />
                    </span>
                    {c.nom}
                    <span className="delta flat" style={{ marginLeft: "auto" }}>{c.valeur}%</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* ─── Tuiles de chiffres ─── */}
      <div className="stat-row" style={{ marginBottom: 16 }}>
        <div className="stat">
          <div className="s-label">
            <IconSun style={{ width: 14, height: 14 }} /> Jours actifs
          </div>
          <div className="s-value">
            <CountUp to={rapport.joursEngages} />
            <span style={{ fontSize: 15, color: "var(--ink-3)", fontWeight: 600 }}> / {rapport.joursTotal}</span>
          </div>
          <div className="s-foot">{joursPct}% de la période</div>
          <div className="s-spark">
            <MiniSpark data={sparkJours} color="#0ea98f" variant="bars" />
          </div>
        </div>

        <div className="stat">
          <div className="s-label">
            <IconCheck style={{ width: 14, height: 14 }} /> Tâches cochées
          </div>
          <div className="s-value">
            <CountUp to={rapport.pourcentageTachesFaites} suffix="%" />
          </div>
          <div className="s-foot">du total planifié</div>
          <div className="s-spark">
            <MiniSpark data={sparkTaches} color="#4aa3f5" />
          </div>
        </div>

        <div className="stat">
          <div className="s-label">
            <IconFlame style={{ width: 14, height: 14 }} /> Meilleur streak
          </div>
          <div className="s-value">
            <CountUp to={meilleurStreak?.streak ?? 0} />
            <span style={{ fontSize: 15, color: "var(--ink-3)", fontWeight: 600 }}> j</span>
          </div>
          <div className="s-foot">
            {meilleurStreak && meilleurStreak.streak > 0 ? `${meilleurStreak.icone} ${meilleurStreak.nom}` : "aucune série en cours"}
          </div>
        </div>

        <div className="stat">
          <div className="s-label">
            <IconTarget style={{ width: 14, height: 14 }} /> Objectifs suivis
          </div>
          <div className="s-value">
            <CountUp to={rapport.objectifs.length} />
          </div>
          <div className="s-foot">{moyenneObjectifs}% de progression moyenne</div>
        </div>
      </div>

      {/* ─── Activité + radar ─── */}
      <div className="grid g-split" style={{ marginBottom: 16 }}>
        <section className="panel panel-pad-lg spot">
          <div className="panel-head">
            <div className="chip violet">
              <IconFlame />
            </div>
            <div className="ph-text">
              <h2>Régularité par discipline</h2>
              <p>Part des jours tenus sur la période</p>
            </div>
          </div>
          {rapport.disciplines.length >= 3 ? (
            <RadarChart
              size={330}
              axes={rapport.disciplines.map((d) => ({
                label: d.nom.length > 11 ? `${d.nom.slice(0, 10)}…` : d.nom,
                value: disciplinePct(d),
                sub: `${d.joursValides}j`,
              }))}
            />
          ) : rapport.disciplines.length > 0 ? (
            <div style={{ paddingTop: 4 }}>
              {rapport.disciplines.map((d, i) => (
                <div className="meter" key={d.id}>
                  <div className="meter-head">
                    <span className="meter-name">
                      {d.icone} {d.nom}
                    </span>
                    <span className="meter-value">{d.joursValides} j</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill violet"
                      style={{ width: `${disciplinePct(d)}%`, animationDelay: `${i * 90}ms` }}
                    />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11.5, color: "var(--ink-4)", margin: "12px 0 0" }}>
                Le radar apparaît à partir de trois disciplines suivies.
              </p>
            </div>
          ) : (
            <div className="empty">
              <IconFlame />
              Aucune discipline suivie pour l&apos;instant.
            </div>
          )}
        </section>

        <section className="panel panel-pad-lg spot">
          <div className="panel-head">
            <div className="chip">
              <IconChart />
            </div>
            <div className="ph-text">
              <h2>Activité jour par jour</h2>
              <p>Part des tâches cochées chaque jour</p>
            </div>
            <div className="ph-right">
              <span className="delta up">{joursPct}% de jours actifs</span>
            </div>
          </div>
          <AreaChart data={serieChart} highlight={(d) => (d.value >= 100 ? "#0ea98f" : null)} />
          <p style={{ fontSize: 11.5, color: "var(--ink-4)", margin: "10px 0 0" }}>
            Les points verts marquent les journées bouclées à 100 %.
          </p>
        </section>
      </div>

      {/* ─── Objectifs ─── */}
      <section className="panel panel-pad-lg spot">
        <div className="panel-head">
          <div className="chip">
            <IconTarget />
          </div>
          <div className="ph-text">
            <h2>Avancement des objectifs</h2>
            <p>Progression calculée par chaque objectif selon son propre type</p>
          </div>
        </div>
        {rapport.objectifs.length === 0 ? (
          <div className="empty">
            <IconTarget />
            Aucun objectif actif. Ils apparaîtront ici dès que tu en créeras un.
          </div>
        ) : (
          <div className="grid g-3">
            {rapport.objectifs.map((o, i) => (
              <div
                key={o.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 14,
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-md)",
                  background: "var(--surface-2)",
                }}
              >
                <ProgressRing value={o.progression} size={64} stroke={7} delay={i * 110}>
                  <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" }}>{o.progression}%</span>
                </ProgressRing>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 650, letterSpacing: "-0.01em" }}>{o.nom}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>{o.unite}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 18, display: "flex", alignItems: "center", gap: 6 }}>
        <IconSparkle style={{ width: 13, height: 13 }} />
        Tous les chiffres sont recalculés à chaque chargement à partir de tes données réelles.
      </p>
    </>
  );
}
