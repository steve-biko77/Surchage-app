import { tachesRecurrentesRepository, tachesRepository } from "@/lib/adapters/repositories";
import { jourSemaineISO } from "./services";

/**
 * Insere dans `taches` une occurrence pour chaque modele actif applicable a `date`
 * (journaliere, ou hebdomadaire au bon jour de semaine). Idempotent : ne recree
 * jamais une tache deja materialisee pour ce modele + cette date.
 *
 * Rend les occurrences effectivement creees. L'appelant s'en sert pour poser
 * leurs rappels calendaires : ce module ne connait pas Google, et ne doit pas
 * le connaitre.
 */
export async function materialiserTachesRecurrentes(date: string) {
  const modeles = await tachesRecurrentesRepository.actives();
  const jour = jourSemaineISO(date);

  const applicables = modeles.filter((m) =>
    m.frequence === "journaliere" ? true : m.joursSemaine.includes(jour)
  );

  const creees = [];
  for (const modele of applicables) {
    const dejaMaterialisee = await tachesRepository.existeDejaPourRecurrence(modele.id, date);
    if (dejaMaterialisee) continue;
    creees.push(
      await tachesRepository.create({
        date,
        texte: modele.texte,
        heure: modele.heure,
        objectifId: modele.objectifId,
        tacheRecurrenteId: modele.id,
      })
    );
  }
  return creees;
}
