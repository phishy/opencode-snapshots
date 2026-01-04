import { NextResponse } from "next/server";
import { projectExists, getSnapshots, getLatestSnapshot } from "@/lib/opencode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!projectExists(id)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const snapshots = getSnapshots(id);
  const latestHash = getLatestSnapshot(id);

  return NextResponse.json({
    projectId: id,
    latestSnapshot: latestHash,
    snapshots,
  });
}
