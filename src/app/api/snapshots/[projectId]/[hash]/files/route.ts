import { NextResponse } from "next/server";
import { projectExists, validateSnapshotHash, getSnapshotFiles, getFileContent } from "@/lib/opencode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; hash: string }> }
) {
  const { projectId, hash } = await params;
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!projectExists(projectId)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!validateSnapshotHash(projectId, hash)) {
    return NextResponse.json({ error: "Invalid snapshot hash" }, { status: 400 });
  }

  if (filePath) {
    const files = getSnapshotFiles(projectId, hash);
    const file = files.find((f) => f.path === filePath);
    
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = getFileContent(projectId, file.hash);
    return NextResponse.json({ path: filePath, content });
  }

  const files = getSnapshotFiles(projectId, hash);
  return NextResponse.json({ files });
}
