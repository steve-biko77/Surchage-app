import { tachesRecurrentesRepository, tachesRepository } from "@/lib/adapters/repositories";
import { jourSemaineISO } from "./services";

/**
 * Insere dans `taches` une occurrence pour chaque modele actif applicable a `date`
 * (journaliere, ou hebdomadaire au bon jour de semaine). Idempotent : ne recree
 * jamais une tache deja materialisee pour ce modele + cette date.
 */
export async function materialiserTachesRecurrentes(date: string): Promise<void> {
  const modeles = await tachesRecurrentesRepository.actives();
  const jour = jourSemaineISO(date);

  const applicables = modeles.filter((m) =>
    m.frequence === "journaliere" ? true : m.joursSemaine.includes(jour)
  );

  for (const modele of applicables) {
    const dejaMaterialisee = await tachesRepository.existeDejaPourRecurrence(modele.id, date);
    if (dejaMaterialisee) continue;
    await tachesRepository.create({
      date,
      texte: modele.texte,
      heure: modele.heure,
      objectifId: modele.objectifId,
      tacheRecurrenteId: modele.id,
    });
  }
}
