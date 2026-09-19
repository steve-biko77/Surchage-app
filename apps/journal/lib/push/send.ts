import webpush from "web-push";
import { pushSubscriptionsRepository } from "@/lib/adapters/repositories";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@example.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquants. Verifie les variables d'environnement Vercel du projet journal-productivity."
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type NotificationPayload = { title: string; body: string; url?: string };

/** Envoie une notification a tous les abonnes ; supprime les abonnements devenus invalides (410/404). */
export async function envoyerATous(payload: NotificationPayload) {
  ensureConfigured();
  const abonnes = await pushSubscriptionsRepository.all();
  const body = JSON.stringify(payload);

  const resultats = await Promise.allSettled(
    abonnes.map((abonne) =>
      webpush.sendNotification(
        {
          endpoint: abonne.endpoint,
          keys: { p256dh: abonne.p256dh, auth: abonne.auth },
        },
        body
      )
    )
  );

  await Promise.all(
    resultats.map(async (resultat, i) => {
      if (resultat.status === "rejected") {
        const statusCode = (resultat.reason as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await pushSubscriptionsRepository.supprimer(abonnes[i].endpoint);
        }
      }
    })
  );

  return {
    envoyes: resultats.filter((r) => r.status === "fulfilled").length,
    echecs: resultats.filter((r) => r.status === "rejected").length,
    total: abonnes.length,
  };
}
