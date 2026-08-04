export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { exercicesRepository } from "@/lib/adapters/repositories";

export async function GET() {
  const rows = await exercicesRepository.all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const row = await exercicesRepository.create(body);
  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: Request) {
  const { id, prioritaire, objectifId } = await req.json();
  const row = await exercicesRepository.togglePrioritaire(id, prioritaire, objectifId ?? null);
  return NextResponse.json(row);
}
