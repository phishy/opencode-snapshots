import { NextResponse } from "next/server";
import { getSessionInfo, getSnapshotArchive } from "@/lib/opencode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const info = getSessionInfo(sessionId);

  if (!info) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!info.session.snapshot) {
    return NextResponse.json({ error: "No snapshot available for this session" }, { status: 404 });
  }

  const archive = getSnapshotArchive(info.projectId, info.session.snapshot);

  if (!archive) {
    return NextResponse.json({ error: "Failed to create archive" }, { status: 500 });
  }

  const filename = `${sessionId}.zip`;

  return new NextResponse(new Uint8Array(archive), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
