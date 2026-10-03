export const dynamic = "force-dynamic";
import { tachesRepository, objectifsRepository, notesJourRepository } from "@/lib/adapters/repositories";
import { todayISO, decalerDate } from "@/lib/domain/services";
import { materialiserTachesRecurrentes } from "@/lib/domain/recurrence";
import JourClient from "@/components/JourClient";

export default async function JourPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam || todayISO();

  // Filet de securite si le cron horaire n'a pas encore tourne aujourd'hui.
  if (date === todayISO()) {
    await materialiserTachesRecurrentes(date);
  }

  const today = todayISO();
  const estAujourdhui = date === today;

  const [tachesDuJour, reportees, objectifs, note] = await Promise.all([
    tachesRepository.parDate(date),
    estAujourdhui ? tachesRepository.reporteesAvant(date) : Promise.resolve([]),
    objectifsRepository.all(),
    notesJourRepository.parDate(date),
  ]);

  // La fusion des taches reportees ne s'applique QUE sur la date du jour reel --
  // en navigation passee, la date s'affiche telle qu'elle etait reellement.
  const taches = [
    ...tachesDuJour.map((t) => ({ ...t, reporteLe: null as string | null })),
    ...reportees.map((t) => ({ ...t, reporteLe: t.date as string | null })),
  ];

  return (
    <JourClient
      date={date}
      today={today}
      prevDate={decalerDate(date, -1)}
      nextDate={decalerDate(date, 1)}
      taches={taches}
      objectifs={objectifs.map((o) => ({ id: o.id, nom: o.nom }))}
      noteInitiale={note?.texte ?? ""}
    />
  );
}
