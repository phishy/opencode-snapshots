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
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-zinc-800"
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
              >
                <span className="text-zinc-500">{isExpanded ? "▼" : "▶"}</span>
                <span className="text-blue-400">{dir}/</span>
                <span className="text-zinc-600 text-xs">({dirFiles.length})</span>
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
            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${
              selectedFile?.path === file.path
                ? "bg-blue-500/20 text-blue-300"
                : "hover:bg-zinc-800 text-zinc-300"
            }`}
            style={{ paddingLeft: `${depth * 16 + 24}px` }}
          >
            <span className="text-zinc-500">📄</span>
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
          <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-400">Latest Snapshot</p>
                <p className="font-mono text-xs text-zinc-500">{latestSnapshot.slice(0, 12)}...</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSnapshot(latestSnapshot)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSnapshot === latestSnapshot
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => window.open(`/api/snapshots/${projectId}/${latestSnapshot}/download`, "_blank")}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-400">Snapshot Timeline</h3>
          <p className="mb-3 text-xs text-zinc-600">{snapshots.length} snapshots found</p>
          <div className="max-h-[500px] space-y-4 overflow-auto">
            {Object.entries(groupedSnapshots).map(([date, dateSnapshots]) => (
              <div key={date}>
                <p className="mb-1 text-xs font-medium text-zinc-500">{date}</p>
                <div className="space-y-1">
                  {dateSnapshots.map((snapshot) => (
                    <button
                      key={snapshot.hash}
                      onClick={() => setSelectedSnapshot(snapshot.hash)}
                      className={`w-full rounded border p-2 text-left transition-colors ${
                        selectedSnapshot === snapshot.hash
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-zinc-500">
                          {snapshot.hash.slice(0, 8)}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {formatRelativeTime(snapshot.timestamp)}
                        </span>
                      </div>
                      {snapshot.sessionTitle && (
                        <p className="mt-1 truncate text-xs text-zinc-400">
                          {snapshot.sessionTitle}
                        </p>
                      )}
                      <p className="text-xs text-zinc-600">
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
          <div className="rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div>
                <p className="font-mono text-sm text-zinc-300">{selectedSnapshot.slice(0, 16)}...</p>
                <p className="text-xs text-zinc-500">{files.length} files</p>
              </div>
              <button
                onClick={() => window.open(`/api/snapshots/${projectId}/${selectedSnapshot}/download`, "_blank")}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Download ZIP
              </button>
            </div>

            <div className="grid lg:grid-cols-[250px_minmax(0,1fr)]">
              <div className="max-h-[500px] overflow-auto border-r border-zinc-800 py-2">
                {loading ? (
                  <p className="px-4 py-2 text-sm text-zinc-500">Loading files...</p>
                ) : (
                  renderFileTree(files)
                )}
              </div>

              <div className="max-h-[500px] overflow-auto">
                {selectedFile ? (
                  <div>
                    <div className="sticky top-0 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
                      <p className="font-mono text-sm text-zinc-300">{selectedFile.path}</p>
                    </div>
                    <pre className="p-4 text-xs leading-relaxed">
                      {fileContent.split("\n").map((line, i) => (
                        <div key={i} className="flex">
                          <span className="mr-4 w-8 select-none text-right text-zinc-600">
                            {i + 1}
                          </span>
                          <code className="text-zinc-300">{line || " "}</code>
                        </div>
                      ))}
                    </pre>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-8">
                    <p className="text-zinc-500">Select a file to view contents</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-400">Select a snapshot to browse files</p>
          </div>
        )}
      </div>
    </div>
  );
}
