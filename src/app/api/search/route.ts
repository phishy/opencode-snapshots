import { NextResponse } from "next/server";
import { searchPrompts, getSnapshotForMessage, getSearchIndexStats } from "@/lib/opencode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  if (!query) {
    const stats = getSearchIndexStats();
    return NextResponse.json({ 
      error: "Missing query parameter 'q'",
      stats,
    }, { status: 400 });
  }

  const results = searchPrompts(query, limit);

  const resultsWithSnapshots = results.map((result) => ({
    ...result,
    snapshot: getSnapshotForMessage(result.sessionId, result.messageId),
  }));

  return NextResponse.json({
    query,
    count: resultsWithSnapshots.length,
    results: resultsWithSnapshots,
  });
}
