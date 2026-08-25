export const dynamic = "force-dynamic";
import { tachesRepository, objectifsRepository } from "@/lib/adapters/repositories";
import { todayISO, decalerDate } from "@/lib/domain/services";
import JourClient from "@/components/JourClient";

export default async function JourPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam || todayISO();

  const [taches, objectifs] = await Promise.all([
    tachesRepository.parDate(date),
    objectifsRepository.all(),
  ]);

  return (
    <JourClient
      date={date}
      today={todayISO()}
      prevDate={decalerDate(date, -1)}
      nextDate={decalerDate(date, 1)}
      taches={taches}
      objectifs={objectifs.map((o) => ({ id: o.id, nom: o.nom }))}
    />
  );
}
