export const dynamic = "force-dynamic";
import { notesJourRepository, joursValidesRepository, disciplinesRepository } from "@/lib/adapters/repositories";

type Entree = {
  date: string;
  texte: string;
  type: "jour" | "checkin";
  label: string;
  icone?: string;
  couleur?: string;
};

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

  return (
    <div className="card">
      <h2>Journal</h2>
      {entrees.length === 0 ? (
        <div className="empty">
          Aucune note pour l&apos;instant. Écris quelque chose sur /jour ou lors d&apos;un check-in de discipline.
        </div>
      ) : (
        <div className="journal-list">
          {entrees.map((e, i) => (
            <div className="journal-entry" key={`${e.date}-${e.type}-${i}`}>
              <div className="journal-entry-head">
                <span className="journal-date">{formatDate(e.date)}</span>
                <span className="journal-source" style={e.couleur ? { color: e.couleur } : undefined}>
                  {e.icone ? `${e.icone} ` : ""}
                  {e.label}
                </span>
              </div>
              <p className="journal-texte">{e.texte}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
