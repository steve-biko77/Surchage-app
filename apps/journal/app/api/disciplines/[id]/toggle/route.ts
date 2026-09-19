export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { joursValidesRepository } from "@/lib/adapters/repositories";
import { todayISO } from "@/lib/domain/services";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let note: string | null = null;
  try {
    const body = await req.json();
    note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;
  } catch {
    // pas de corps envoye (un-check) -- pas de note dans ce cas
  }
  const valide = await joursValidesRepository.toggle(id, todayISO(), note);
  return NextResponse.json({ valide });
}
