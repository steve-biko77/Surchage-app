import { getGoogleAccessToken } from "./auth";
import { todayISO } from "@/lib/domain/services";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

async function appelCalendar(path: string, init?: RequestInit) {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
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
