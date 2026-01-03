import { NextResponse } from "next/server";
import { getSessionDiff } from "@/lib/opencode";
import archiver from "archiver";
import { Readable } from "stream";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const diffs = getSessionDiff(sessionId);

  if (diffs.length === 0) {
    return NextResponse.json({ error: "No files found" }, { status: 404 });
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  archive.on("data", (chunk) => chunks.push(chunk));

  for (const diff of diffs) {
    if (diff.after) {
      archive.append(diff.after, { name: diff.file });
    }
  }

  await archive.finalize();

  const buffer = Buffer.concat(chunks);
  const filename = `${sessionId}.zip`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
