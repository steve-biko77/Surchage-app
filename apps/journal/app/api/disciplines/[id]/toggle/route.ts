export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { joursValidesRepository } from "@/lib/adapters/repositories";
import { todayISO } from "@/lib/domain/services";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valide = await joursValidesRepository.toggle(id, todayISO());
  return NextResponse.json({ valide });
}
