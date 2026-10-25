export const dynamic = "force-dynamic";
import {
  tachesRepository,
  objectifsRepository,
  notesJourRepository,
  disciplinesRepository,
  joursValidesRepository,
} from "@/lib/adapters/repositories";
import {
  todayISO,
  decalerDate,
  calculerStreak,
  debutSemaine,
  heureLocaleParis,
} from "@/lib/domain/services";
import { materialiserTachesRecurrentes } from "@/lib/domain/recurrence";
import JourClient from "@/components/JourClient";
import WidgetAccueil from "@/components/WidgetAccueil";

const LETTRES = ["L", "M", "M", "J", "V", "S", "D"];

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

  // Les widgets ne sont charges que sur la journee du jour : une serie ou une
  // case a cocher n'a pas de sens sur une journee archivee, et les boutons de
  // validation ne savent de toute facon ecrire que sur aujourd'hui.
  let widget = null;
  if (estAujourdhui) {
    // 400 jours : largement au-dela de la plus longue serie plausible, et une
    // seule requete au lieu d'un balayage complet de la table.
    const [disciplines, datesValidees, valideesAujourdhui] = await Promise.all([
      disciplinesRepository.all(),
      joursValidesRepository.datesValideesDepuis(decalerDate(today, -400)),
      joursValidesRepository.disciplinesValideesLe(today),
    ]);
    const faites = new Set(valideesAujourdhui);
    const lundi = debutSemaine(today);

    widget = (
      <WidgetAccueil
        date={date}
        heure={heureLocaleParis()}
        streak={calculerStreak(datesValidees, today)}
        semaine={Array.from({ length: 7 }, (_, i) => {
          const d = decalerDate(lundi, i);
          return {
            date: d,
            lettre: LETTRES[i],
            validee: datesValidees.includes(d),
            estAujourdhui: d === today,
            futur: d > today,
          };
        })}
        disciplines={disciplines.map((d) => ({
          id: d.id,
          nom: d.nom,
          icone: d.icone,
          couleur: d.couleur,
          faite: faites.has(d.id),
        }))}
        taches={taches.map((t) => ({
          id: t.id,
          texte: t.texte,
          heure: t.heure,
          fait: t.fait,
        }))}
        noteInitiale={note?.texte ?? ""}
      />
    );
  }

  return (
    <>
      {widget}
      <JourClient
        date={date}
        today={today}
        prevDate={decalerDate(date, -1)}
        nextDate={decalerDate(date, 1)}
        taches={taches}
        objectifs={objectifs.map((o) => ({ id: o.id, nom: o.nom }))}
        noteInitiale={note?.texte ?? ""}
        avecNote={!estAujourdhui}
      />
    </>
  );
}
