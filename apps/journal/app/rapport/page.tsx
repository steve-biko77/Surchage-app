export const dynamic = "force-dynamic";
import { JournalModule } from "@/src/JournalModule";
import { todayISO, decalerDate } from "@/lib/domain/services";
import RapportClient from "@/components/RapportClient";

export default async function RapportPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode: periodeParam } = await searchParams;
  const periode = periodeParam === "30" ? 30 : 7;

  const dateFin = todayISO();
  const dateDebut = decalerDate(dateFin, -(periode - 1));

  const rapport = await new JournalModule().getRapport(dateDebut, dateFin);

  return <RapportClient periode={periode} rapport={rapport} />;
}
