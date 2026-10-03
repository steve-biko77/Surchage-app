export const dynamic = "force-dynamic";
import { disciplinesRepository, joursValidesRepository } from "@/lib/adapters/repositories";
import { disciplineDepuisRow } from "@/lib/domain/mappers";
import { todayISO, decalerDate, calculerStreak } from "@/lib/domain/services";
import DisciplinesClient from "@/components/DisciplinesClient";

export default async function DisciplinesPage() {
  const today = todayISO();
  const disciplines = await disciplinesRepository.all();

  const data = await Promise.all(
    disciplines.map(async (row) => {
      const jours = await joursValidesRepository.parDiscipline(row.id);
      const historique = jours.map((j) => j.date);
      const instance = disciplineDepuisRow(row);
      const niveauFlamme = instance.calculerNiveauFlamme(historique, today);
      const streak = calculerStreak(historique, today);
      const historique14 = Array.from({ length: 14 }, (_, i) => {
        const d = decalerDate(today, -13 + i);
        return { date: d, fait: historique.includes(d) };
      });
      return {
        id: row.id,
        nom: row.nom,
        icone: row.icone,
        couleur: row.couleur,
        streak,
        niveauFlamme,
        faitAujourdhui: historique.includes(today),
        historique14,
      };
    })
  );

  const faites = data.filter((d) => d.faitAujourdhui).length;

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Disciplines</h1>
          <p className="page-sub">
            {data.length === 0
              ? "Aucune discipline suivie."
              : `${faites} sur ${data.length} validée${data.length > 1 ? "s" : ""} aujourd'hui.`}
          </p>
        </div>
      </header>

      <DisciplinesClient disciplines={data} />
    </>
  );
}
