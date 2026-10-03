export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { tachesRepository } from "@/lib/adapters/repositories";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await tachesRepository.ignorer(id);
  return NextResponse.json(row);
}
