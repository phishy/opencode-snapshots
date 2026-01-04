"use client";

import { useState, useEffect } from "react";

interface Snapshot {
  hash: string;
  timestamp: number;
  type: "step-start" | "step-finish";
  sessionId: string;
  sessionTitle?: string;
  messageId: string;
}

interface FileEntry {
  mode: string;
  type: string;
  hash: string;
  path: string;
  name: string;
}

interface Props {
  projectId: string;
  latestSnapshot: string | null;
  snapshots: Snapshot[];
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function SnapshotBrowser({ projectId, latestSnapshot, snapshots }: Props) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(latestSnapshot);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedSnapshot) {
      setLoading(true);
      fetch(`/api/snapshots/${projectId}/${selectedSnapshot}/files`)
        .then((res) => res.json())
        .then((data) => {
          setFiles(data.files || []);
          setSelectedFile(null);
          setFileContent("");
        })
        .finally(() => setLoading(false));
    }
  }, [selectedSnapshot, projectId]);

  async function loadFileContent(file: FileEntry) {
    setSelectedFile(file);
    const res = await fetch(
      `/api/snapshots/${projectId}/${selectedSnapshot}/files?path=${encodeURIComponent(file.path)}`
    );
    const data = await res.json();
    setFileContent(data.content || "");
  }

  function toggleDir(dir: string) {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) {
        next.delete(dir);
      } else {
        next.add(dir);
      }
      return next;
    });
  }

  function buildFileTree(files: FileEntry[]) {
    const tree: Record<string, FileEntry[]> = { "": [] };

    for (const file of files) {
      const parts = file.path.split("/");
      if (parts.length === 1) {
        tree[""].push(file);
      } else {
        const dir = parts.slice(0, -1).join("/");
        if (!tree[dir]) tree[dir] = [];
        tree[dir].push(file);
      }
    }

    return tree;
  }

  function renderFileTree(files: FileEntry[], depth = 0) {
    const tree = buildFileTree(files);
    const dirs = new Set<string>();
    const rootFiles: FileEntry[] = [];

    for (const file of files) {
      const parts = file.path.split("/");
      if (parts.length === 1) {
        rootFiles.push(file);
      } else {
        dirs.add(parts[0]);
      }
    }

    const sortedDirs = Array.from(dirs).sort();
    const sortedFiles = rootFiles.sort((a, b) => a.name.localeCompare(b.name));

    return (
      <>
        {sortedDirs.map((dir) => {
          const dirFiles = files.filter((f) => f.path.startsWith(dir + "/"));
          const isExpanded = expandedDirs.has(dir);
          return (
            <div key={dir}>
              <button
                onClick={() => toggleDir(dir)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-oc-bg-elevated transition-colors"
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
              >
                <span className="text-oc-text-weak">{isExpanded ? "▼" : "▶"}</span>
                <span className="text-oc-blue">{dir}/</span>
                <span className="text-oc-text-weak text-xs">({dirFiles.length})</span>
              </button>
              {isExpanded && (
                <div>
                  {renderFileTree(
                    dirFiles.map((f) => ({
                      ...f,
                      path: f.path.slice(dir.length + 1),
                      name: f.path.slice(dir.length + 1).split("/").pop() || f.name,
                    })),
                    depth + 1
                  )}
                </div>
              )}
            </div>
          );
        })}
        {sortedFiles.map((file) => (
          <button
            key={file.path}
            onClick={() => loadFileContent(file)}
            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition-colors ${
              selectedFile?.path === file.path
                ? "bg-oc-blue/20 text-oc-blue"
                : "hover:bg-oc-bg-elevated text-oc-text-base"
            }`}
            style={{ paddingLeft: `${depth * 16 + 24}px` }}
          >
            <span className="text-oc-text-weak text-xs">◇</span>
            {file.name}
          </button>
        ))}
      </>
    );
  }

  const groupedSnapshots = snapshots.reduce((acc, snapshot) => {
    const date = new Date(snapshot.timestamp).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(snapshot);
    return acc;
  }, {} as Record<string, Snapshot[]>);

  return (
    <div className="grid gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
      <div className="space-y-4">
        {latestSnapshot && (
          <div className="rounded-lg border border-oc-green/30 bg-oc-green/10 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-oc-green">Latest Snapshot</p>
                <p className="font-mono text-xs text-oc-text-weak">{latestSnapshot.slice(0, 12)}...</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSnapshot(latestSnapshot)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSnapshot === latestSnapshot
                      ? "bg-oc-green text-oc-bg-base"
                      : "bg-oc-bg-elevated text-oc-text-base hover:bg-oc-border"
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => window.open(`/api/snapshots/${projectId}/${latestSnapshot}/download`, "_blank")}
                  className="rounded bg-oc-green/20 border border-oc-green/30 px-3 py-1.5 text-xs font-medium text-oc-green transition-colors hover:bg-oc-green/30"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-medium text-oc-text-strong">Snapshot Timeline</h3>
          <p className="mb-3 text-xs text-oc-text-weak">{snapshots.length} snapshots found</p>
          <div className="max-h-[500px] space-y-4 overflow-auto">
            {Object.entries(groupedSnapshots).map(([date, dateSnapshots]) => (
              <div key={date}>
                <p className="mb-1 text-xs font-medium text-oc-text-weak">{date}</p>
                <div className="space-y-1">
                  {dateSnapshots.map((snapshot) => (
                    <button
                      key={snapshot.hash}
                      onClick={() => setSelectedSnapshot(snapshot.hash)}
                      className={`w-full rounded border p-2 text-left transition-colors ${
                        selectedSnapshot === snapshot.hash
                          ? "border-oc-blue/50 bg-oc-blue/10"
                          : "border-oc-border-subtle bg-oc-bg-weak hover:border-oc-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-oc-text-weak">
                          {snapshot.hash.slice(0, 8)}
                        </span>
                        <span className="text-xs text-oc-text-weak">
                          {formatRelativeTime(snapshot.timestamp)}
                        </span>
                      </div>
                      {snapshot.sessionTitle && (
                        <p className="mt-1 truncate text-xs text-oc-text-base">
                          {snapshot.sessionTitle}
                        </p>
                      )}
                      <p className="text-xs text-oc-text-weak">
                        {snapshot.type === "step-start" ? "Before step" : "After step"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        {selectedSnapshot ? (
          <div className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak">
            <div className="flex items-center justify-between border-b border-oc-border-subtle px-4 py-3">
              <div>
                <p className="font-mono text-sm text-oc-text-base">{selectedSnapshot.slice(0, 16)}...</p>
                <p className="text-xs text-oc-text-weak">{files.length} files</p>
              </div>
              <button
                onClick={() => window.open(`/api/snapshots/${projectId}/${selectedSnapshot}/download`, "_blank")}
                className="rounded bg-oc-green/20 border border-oc-green/30 px-4 py-2 text-sm font-medium text-oc-green transition-colors hover:bg-oc-green/30"
              >
                Download ZIP
              </button>
            </div>

            <div className="grid lg:grid-cols-[250px_minmax(0,1fr)]">
              <div className="max-h-[500px] overflow-auto border-r border-oc-border-subtle py-2">
                {loading ? (
                  <p className="px-4 py-2 text-sm text-oc-text-weak">Loading files...</p>
                ) : (
                  renderFileTree(files)
                )}
              </div>

              <div className="max-h-[500px] overflow-auto">
                {selectedFile ? (
                  <div>
                    <div className="sticky top-0 border-b border-oc-border-subtle bg-oc-bg-weak px-4 py-2">
                      <p className="font-mono text-sm text-oc-text-base">{selectedFile.path}</p>
                    </div>
                    <pre className="p-4 text-xs leading-relaxed font-mono">
                      {fileContent.split("\n").map((line, i) => (
                        <div key={i} className="flex">
                          <span className="mr-4 w-8 select-none text-right text-oc-text-weak">
                            {i + 1}
                          </span>
                          <code className="text-oc-text-base">{line || " "}</code>
                        </div>
                      ))}
                    </pre>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-8">
                    <p className="text-oc-text-weak">Select a file to view contents</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak p-8 text-center">
            <p className="text-oc-text-weak">Select a snapshot to browse files</p>
          </div>
        )}
      </div>
    </div>
  );
}
