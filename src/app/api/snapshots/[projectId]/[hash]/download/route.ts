import { NextResponse } from "next/server";
import { getProject, validateSnapshotHash, getSnapshotArchive } from "@/lib/opencode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; hash: string }> }
) {
  const { projectId, hash } = await params;
  const project = getProject(projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!validateSnapshotHash(projectId, hash)) {
    return NextResponse.json({ error: "Invalid snapshot hash" }, { status: 400 });
  }

  const archive = getSnapshotArchive(projectId, hash);

  if (!archive) {
    return NextResponse.json({ error: "Failed to create archive" }, { status: 500 });
  }

  const filename = `${project.name}-${hash.slice(0, 8)}.zip`;

  return new NextResponse(new Uint8Array(archive), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
