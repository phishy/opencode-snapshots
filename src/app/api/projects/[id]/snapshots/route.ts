import { NextResponse } from "next/server";
import { getProject, getSnapshots, getLatestSnapshot } from "@/lib/opencode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
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
