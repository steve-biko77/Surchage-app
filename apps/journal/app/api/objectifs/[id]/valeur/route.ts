export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { objectifsRepository } from "@/lib/adapters/repositories";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { valeur } = await req.json();
  if (valeur == null) {
    return NextResponse.json({ error: "valeur invalide" }, { status: 400 });
  }
  const row = await objectifsRepository.setValeurActuelle(id, valeur);
  return NextResponse.json(row);
}
