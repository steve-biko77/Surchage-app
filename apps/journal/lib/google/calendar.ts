import { getGoogleAccessToken } from "./auth";
import { todayISO } from "@/lib/domain/services";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

const FUSEAU = "Europe/Paris";

async function appelCalendarBrut(path: string, init?: RequestInit): Promise<Response> {
  const accessToken = await getGoogleAccessToken();
  return fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

async function appelCalendar(path: string, init?: RequestInit) {
  const response = await appelCalendarBrut(path, init);
  if (!response.ok) {
    const corps = await response.text();
    throw new Error(`Appel Google Calendar echoue (${response.status}) : ${corps}`);
  }
  return response.json();
}

/** Cree un calendrier secondaire (calendars.insert) et retourne son id Google. */
export async function creerCalendrierSecondaire(nom: string): Promise<string> {
  const calendrier = (await appelCalendar("/calendars", {
    method: "POST",
    body: JSON.stringify({ summary: nom, timeZone: "Europe/Paris" }),
  })) as { id: string };
  return calendrier.id;
}

/**
 * Cree l'evenement recurrent d'ancrage a 6h00, une seule fois -- Calendar gere
 * seul la recurrence ensuite (RRULE:FREQ=DAILY), aucun cron necessaire pour celui-la.
 * Heure locale + timeZone (plutot qu'un instant UTC fixe) pour que la recurrence
 * traverse les changements d'heure ete/hiver sans glisser.
 */
export async function creerEvenementAncrage(calendarId: string): Promise<void> {
  const date = todayISO();
  await appelCalendar(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    body: JSON.stringify({
      summary: "📓 Remplir ta journée",
      start: { dateTime: `${date}T06:00:00`, timeZone: "Europe/Paris" },
      end: { dateTime: `${date}T06:05:00`, timeZone: "Europe/Paris" },
      recurrence: ["RRULE:FREQ=DAILY"],
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 0 }] },
    }),
  });
}

/** Cree un evenement ponctuel de rappel (nudge adaptatif), demarre dans 2 min. */
export async function creerEvenementRappel(calendarId: string, titre: string): Promise<void> {
  const debut = new Date(Date.now() + 2 * 60 * 1000);
  const fin = new Date(debut.getTime() + 5 * 60 * 1000);
  await appelCalendar(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    body: JSON.stringify({
      summary: titre,
      start: { dateTime: debut.toISOString() },
      end: { dateTime: fin.toISOString() },
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 0 }] },
    }),
  });
}


// ---------------------------------------------------------------------------
// Rappels des taches a heure fixe
// ---------------------------------------------------------------------------

/**
 * Identifiant d'evenement derive de l'identifiant de la tache.
 *
 * Google impose un identifiant en base32hex : seuls les caracteres a-v et 0-9,
 * de 5 a 1024 caracteres. Un UUID prive de ses tirets est une suite de 32
 * caracteres hexadecimaux, donc un sous-ensemble valide.
 *
 * Deriver l'identifiant plutot que le stocker evite une colonne, donc une
 * migration -- mais surtout, cela supprime toute possibilite de
 * desynchronisation entre la base et le calendrier : on retrouve l'evenement
 * d'une tache a partir de la tache seule, meme si une ecriture precedente a
 * echoue a mi-chemin.
 */
export function rappelIdDeTache(tacheId: string): string {
  return "t" + tacheId.replace(/-/g, "").toLowerCase();
}

/**
 * Fin de creneau, cinq minutes apres le debut.
 *
 * Le calcul se fait en UTC sur les composantes NAIVES de la date et de l'heure,
 * puis on rattache explicitement le fuseau Europe/Paris dans la requete. C'est
 * ce qui rend le passage a 23h58 correct (il bascule au lendemain) sans jamais
 * introduire de decalage ete/hiver.
 */
function finCinqMinutesApres(date: string, heure: string): { date: string; heure: string } {
  const [annee, mois, jour] = date.split("-").map(Number);
  const [hh, mm] = heure.split(":").map(Number);
  const t = new Date(Date.UTC(annee, mois - 1, jour, hh, mm));
  t.setUTCMinutes(t.getUTCMinutes() + 5);
  const deuxChiffres = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${t.getUTCFullYear()}-${deuxChiffres(t.getUTCMonth() + 1)}-${deuxChiffres(t.getUTCDate())}`,
    heure: `${deuxChiffres(t.getUTCHours())}:${deuxChiffres(t.getUTCMinutes())}`,
  };
}

/**
 * Pose le rappel d'une tache a heure fixe, ou le met a jour s'il existe deja.
 *
 * Google gere ensuite seul la notification a l'heure dite, a la minute pres,
 * sans cron et sans que l'application tourne. C'est le motif deja employe par
 * `creerEvenementAncrage`, applique cette fois a chaque tache.
 */
export async function poserRappelTache(
  calendarId: string,
  tache: { id: string; texte: string; date: string; heure: string }
): Promise<void> {
  const fin = finCinqMinutesApres(tache.date, tache.heure);
  const corps = {
    id: rappelIdDeTache(tache.id),
    summary: tache.texte,
    description: "Tâche du jour — Journal",
    start: { dateTime: `${tache.date}T${tache.heure}:00`, timeZone: FUSEAU },
    end: { dateTime: `${fin.date}T${fin.heure}:00`, timeZone: FUSEAU },
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 0 }] },
    status: "confirmed",
  };
  const base = `/calendars/${encodeURIComponent(calendarId)}/events`;

  const creation = await appelCalendarBrut(base, { method: "POST", body: JSON.stringify(corps) });
  if (creation.ok) return;

  // 409 : l'identifiant existe deja -- soit la tache a ete modifiee, soit son
  // rappel avait ete annule. Dans les deux cas une mise a jour complete remet
  // l'evenement dans l'etat voulu, y compris en le ressuscitant s'il etait annule.
  if (creation.status === 409) {
    await appelCalendar(`${base}/${encodeURIComponent(corps.id)}`, {
      method: "PUT",
      body: JSON.stringify(corps),
    });
    return;
  }

  throw new Error(`Creation du rappel echouee (${creation.status}) : ${await creation.text()}`);
}

/**
 * Retire le rappel d'une tache. Un evenement deja absent n'est pas une erreur :
 * la fonction est appelee sans savoir si un rappel avait ete pose.
 */
export async function supprimerRappelTache(calendarId: string, tacheId: string): Promise<void> {
  const response = await appelCalendarBrut(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(rappelIdDeTache(tacheId))}`,
    { method: "DELETE" }
  );
  if (response.ok || response.status === 404 || response.status === 410) return;
  throw new Error(`Suppression du rappel echouee (${response.status})`);
}
