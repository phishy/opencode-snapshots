"use client";

import { useState, useEffect } from "react";
import { SnapshotBrowser } from "./snapshot-browser";

interface Snapshot {
  hash: string;
  timestamp: number;
  type: "step-start" | "step-finish";
  sessionId: string;
  sessionTitle?: string;
  messageId: string;
}

interface Props {
  projectId: string;
  latestSnapshot: string | null;
}

const snapshotCache = new Map<string, { snapshots: Snapshot[]; latestSnapshot: string | null }>();

export function LazySnapshotBrowser({ projectId, latestSnapshot }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = snapshotCache.get(projectId);
    if (cached) {
      setSnapshots(cached.snapshots);
      setLoading(false);
      return;
    }

    fetch(`/api/projects/${projectId}/snapshots`)
      .then((res) => res.json())
      .then((data) => {
        const result = {
          snapshots: data.snapshots || [],
          latestSnapshot: data.latestSnapshot,
        };
        snapshotCache.set(projectId, result);
        setSnapshots(result.snapshots);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak p-8 text-center">
        <p className="text-oc-text-weak">Loading snapshots...</p>
      </div>
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak p-8 text-center">
        <p className="text-oc-text-base">No snapshots found for this project.</p>
      </div>
    );
  }

  const cached = snapshotCache.get(projectId);
  const effectiveLatestSnapshot = latestSnapshot || cached?.latestSnapshot || null;

  return (
    <SnapshotBrowser
      projectId={projectId}
      latestSnapshot={effectiveLatestSnapshot}
      snapshots={snapshots}
    />
  );
}
