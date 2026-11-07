export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

/**
 * Redirige vers l'ecran de consentement Google (scope Calendar, refresh_token garanti).
 *
 * Les trois variables sont verifiees explicitement. Le code precedent utilisait
 * `process.env.X!`, qui ne verifie rien a l'execution : une variable absente
 * devenait la chaine "undefined" dans l'URL, Google repondait 400, et rien
 * n'indiquait que la cause etait une variable manquante cote hebergeur. La
 * connexion a ainsi pu echouer en production pendant des mois sans que personne
 * puisse le diagnostiquer depuis l'application.
 */
export async function GET() {
  const manquantes = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"].filter(
    (nom) => !process.env[nom]
  );

  if (manquantes.length > 0) {
    return NextResponse.json(
      {
        error: "Connexion Google impossible : variables d'environnement manquantes.",
        manquantes,
        ouLesDefinir:
          "Vercel > projet journal-productivity > Settings > Environment Variables, " +
          "pour les environnements Production ET Preview, puis redeployer.",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
