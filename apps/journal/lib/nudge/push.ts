// Envoi Web Push (VAPID).
//
// Jusqu'ici le "nudge" ne produisait qu'un evenement Google Calendar : aucune
// notification n'atteignait le telephone, et quand le calendrier n'etait pas
// connecte la route renvoyait 409, ce qui faisait echouer le workflow.
// Le push devient le canal principal ; le calendrier reste en complement,
// mais son absence n'est plus une erreur.

import webpush, { type PushSubscription } from "web-push";

export type AbonnementStocke = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

let configure = false;

/** Renseigne les cles VAPID. Retourne false si l'environnement est incomplet. */
function configurer(): boolean {
  if (configure) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  // `mailto:` exige par la spec VAPID : c'est le contact que le service de
  // push (Google, Mozilla, Apple) utilise en cas de probleme.
  const sujet = process.env.VAPID_SUBJECT || "mailto:contact@example.com";
  webpush.setVapidDetails(sujet, pub, priv);
  configure = true;
  return true;
}

export function pushConfigure(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export type ResultatEnvoi = {
  envoyes: number;
  /** Endpoints devenus invalides (404/410) : a supprimer de la base. */
  perimes: string[];
  erreurs: number;
};

/**
 * Envoie une notification a tous les abonnements.
 * Un abonnement revoque (404 ou 410) n'est pas une erreur : le navigateur
 * l'a simplement invalide, il faut le retirer de la base.
 */
export async function envoyerPush(
  abonnements: AbonnementStocke[],
  charge: { titre: string; corps: string; url?: string }
): Promise<ResultatEnvoi> {
  const res: ResultatEnvoi = { envoyes: 0, perimes: [], erreurs: 0 };
  if (!configurer() || abonnements.length === 0) return res;

  const payload = JSON.stringify({
    titre: charge.titre,
    corps: charge.corps,
    url: charge.url ?? "/jour",
  });

  await Promise.all(
    abonnements.map(async (a) => {
      const sub: PushSubscription = {
        endpoint: a.endpoint,
        keys: { p256dh: a.p256dh, auth: a.auth },
      };
      try {
        await webpush.sendNotification(sub, payload, { TTL: 3600, urgency: "normal" });
        res.envoyes += 1;
      } catch (e) {
        const statut = (e as { statusCode?: number }).statusCode;
        if (statut === 404 || statut === 410) res.perimes.push(a.endpoint);
        else res.erreurs += 1;
      }
    })
  );

  return res;
}
