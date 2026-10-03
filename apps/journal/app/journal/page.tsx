export const dynamic = "force-dynamic";
import { notesJourRepository, joursValidesRepository, disciplinesRepository } from "@/lib/adapters/repositories";
import { IconBook, IconPen } from "@/components/icons";

type Entree = {
  date: string;
  texte: string;
  type: "jour" | "checkin";
  label: string;
  icone?: string;
  couleur?: string;
};

function formatDate(iso: string): { jour: string; annee: string } {
  const d = new Date(iso + "T00:00:00");
  return {
    jour: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
    annee: String(d.getFullYear()),
  };
}

export default async function JournalPage() {
  const [notes, checkinsAvecNote, disciplines] = await Promise.all([
    notesJourRepository.toutes(),
    joursValidesRepository.avecNotes(),
    disciplinesRepository.all(),
  ]);

  const disciplineParId = new Map(disciplines.map((d) => [d.id, d]));

  const entrees: Entree[] = [
    ...notes.map((n) => ({ date: n.date, texte: n.texte, type: "jour" as const, label: "Note du jour" })),
    ...checkinsAvecNote.map((c) => {
      const disc = disciplineParId.get(c.disciplineId);
      return {
        date: c.date,
        texte: c.note ?? "",
        type: "checkin" as const,
        label: disc?.nom ?? "Discipline",
        icone: disc?.icone,
        couleur: disc?.couleur,
      };
    }),
  ];

  // Plus recent d'abord ; a date egale, la note du jour precede les check-ins.
  entrees.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.type === b.type) return 0;
    return a.type === "jour" ? -1 : 1;
  });

  const joursDistincts = new Set(entrees.map((e) => e.date)).size;

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Journal</h1>
          <p className="page-sub">
            {entrees.length === 0
              ? "Aucune note écrite pour l'instant."
              : `${entrees.length} entrée${entrees.length > 1 ? "s" : ""} sur ${joursDistincts} jour${joursDistincts > 1 ? "s" : ""}.`}
          </p>
        </div>
      </header>

      <section className="panel panel-pad-lg spot">
        <div className="panel-head">
          <div className="chip">
            <IconBook />
          </div>
          <div className="ph-text">
            <h2>Tout ce que tu as écrit</h2>
            <p>Notes de journée et commentaires de check-in, du plus récent au plus ancien</p>
          </div>
        </div>

        {entrees.length === 0 ? (
          <div className="empty">
            <IconPen />
            Écris une note sur la page Jour, ou laisse un mot en validant une discipline — tout atterrit ici.
          </div>
        ) : (
          <div className="journal-list">
            {entrees.map((e, i) => {
              const { jour, annee } = formatDate(e.date);
              const couleur = e.couleur ?? "var(--brand)";
              return (
                <article className="journal-entry" key={`${e.date}-${e.type}-${i}`}>
                  <div className="journal-when">
                    <div className="journal-date">{jour}</div>
                    <div className="journal-year">{annee}</div>
                  </div>
                  <div className="journal-body" style={{ borderLeftColor: couleur }}>
                    <div className="journal-source" style={{ color: couleur }}>
                      {e.icone ? `${e.icone} ` : ""}
                      {e.label}
                    </div>
                    <p className="journal-texte">{e.texte}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
