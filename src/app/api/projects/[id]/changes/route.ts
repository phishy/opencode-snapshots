import { NextResponse } from "next/server";
import { getSessionChanges } from "@/lib/opencode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const changes = getSessionChanges(id);
  return NextResponse.json(changes);
}
