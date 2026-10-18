export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

/**
 * Cle publique VAPID, servie au client au moment de s'abonner.
 * Elle est publique par nature ; la servir ici plutot que via une variable
 * NEXT_PUBLIC_ evite d'avoir a rebatir l'app quand elle change.
 */
export async function GET() {
  const cle = process.env.VAPID_PUBLIC_KEY;
  if (!cle) {
    return NextResponse.json(
      { error: "VAPID_PUBLIC_KEY absente — notifications push non configurees" },
      { status: 503 }
    );
  }
  return NextResponse.json({ cle });
}
