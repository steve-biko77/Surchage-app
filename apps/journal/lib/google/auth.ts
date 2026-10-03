import { googleAuthRepository } from "@/lib/adapters/repositories";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquant dans les variables d'environnement.`);
  return value;
}

/** Echange le code d'autorisation initial contre access_token + refresh_token. */
export async function echangerCodeContreTokens(code: string): Promise<{ accessToken: string; refreshToken: string | null }> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: requireEnv("GOOGLE_REDIRECT_URI"),
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Echange du code Google echoue (${response.status})`);
  }

  const data = (await response.json()) as { access_token: string; refresh_token?: string };
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null };
}

/**
 * Utilise le refresh_token stocke pour obtenir un access_token frais a chaque
 * appel serveur (les access_token expirent en ~1h, le refresh_token non).
 */
export async function getGoogleAccessToken(): Promise<string> {
  const etat = await googleAuthRepository.get();
  if (!etat) {
    throw new Error("Google Calendar non connecte -- visite /api/auth/google/start pour autoriser l'acces.");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: etat.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Rafraichissement du token Google echoue (${response.status})`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}
