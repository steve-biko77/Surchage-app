/** Verifie le header Authorization: Bearer <NUDGE_SECRET> des routes internes (cron, envoi push). */
export function autoriseAppelInterne(req: Request): boolean {
  const secret = process.env.NUDGE_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}
