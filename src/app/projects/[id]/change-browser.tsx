"use client";

import { useState } from "react";

interface FileDiff {
  file: string;
  before: string;
  after: string;
}

interface SessionChange {
  sessionId: string;
  title: string;
  updated: number;
  files: FileDiff[];
  summary?: {
    additions: number;
    deletions: number;
    files: number;
  };
}

interface Props {
  projectId: string;
  changes: SessionChange[];
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function computeDiff(before: string, after: string): string[] {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const result: string[] = [];

  let i = 0, j = 0;
  while (i < beforeLines.length || j < afterLines.length) {
    if (i >= beforeLines.length) {
      result.push(`+${afterLines[j]}`);
      j++;
    } else if (j >= afterLines.length) {
      result.push(`-${beforeLines[i]}`);
      i++;
    } else if (beforeLines[i] === afterLines[j]) {
      result.push(` ${beforeLines[i]}`);
      i++;
      j++;
    } else {
      result.push(`-${beforeLines[i]}`);
      i++;
      if (j < afterLines.length && (i >= beforeLines.length || beforeLines[i] !== afterLines[j])) {
        result.push(`+${afterLines[j]}`);
        j++;
      }
    }
  }

  return result;
}

function DiffViewer({ file }: { file: FileDiff }) {
  const [viewMode, setViewMode] = useState<"diff" | "before" | "after">("diff");
  
  const isNew = !file.before && file.after;
  const isDeleted = file.before && !file.after;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-sm text-zinc-300">{file.file}</span>
        <div className="flex items-center gap-1">
          {isNew && <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">new</span>}
          {isDeleted && <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">deleted</span>}
          {!isNew && !isDeleted && (
            <div className="flex rounded-lg bg-zinc-800 p-0.5 text-xs">
              <button
                onClick={() => setViewMode("diff")}
                className={`rounded px-2 py-1 ${viewMode === "diff" ? "bg-zinc-700 text-white" : "text-zinc-400"}`}
              >
                Diff
              </button>
              <button
                onClick={() => setViewMode("before")}
                className={`rounded px-2 py-1 ${viewMode === "before" ? "bg-zinc-700 text-white" : "text-zinc-400"}`}
              >
                Before
              </button>
              <button
                onClick={() => setViewMode("after")}
                className={`rounded px-2 py-1 ${viewMode === "after" ? "bg-zinc-700 text-white" : "text-zinc-400"}`}
              >
                After
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="max-h-[400px] overflow-auto">
        <pre className="text-xs leading-relaxed">
          {viewMode === "diff" ? (
            computeDiff(file.before, file.after).map((line, i) => {
              let className = "px-4 py-0.5 block ";
              if (line.startsWith("+")) {
                className += "text-emerald-400 bg-emerald-500/10";
              } else if (line.startsWith("-")) {
                className += "text-red-400 bg-red-500/10";
              } else {
                className += "text-zinc-400";
              }
              return <code key={i} className={className}>{line || " "}</code>;
            })
          ) : viewMode === "before" ? (
            file.before.split("\n").map((line, i) => (
              <code key={i} className="px-4 py-0.5 block text-zinc-400">{line || " "}</code>
            ))
          ) : (
            file.after.split("\n").map((line, i) => (
              <code key={i} className="px-4 py-0.5 block text-zinc-400">{line || " "}</code>
            ))
          )}
        </pre>
      </div>
    </div>
  );
}

export function ChangeBrowser({ changes }: Props) {
  const [selectedChange, setSelectedChange] = useState<SessionChange | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileDiff | null>(null);

  function selectChange(change: SessionChange) {
    setSelectedChange(change);
    setSelectedFile(change.files[0] || null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Sessions with Changes</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Click to view file changes from each session.
        </p>
        <div className="space-y-2 max-h-[600px] overflow-auto">
          {changes.map((change) => (
            <button
              key={change.sessionId}
              onClick={() => selectChange(change)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selectedChange?.sessionId === change.sessionId
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <p className="text-sm font-medium text-white">{change.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{formatDate(change.updated)}</p>
              <p className="mt-1 text-xs">
                <span className="text-zinc-400">{change.files.length} files</span>
                {change.summary && (
                  <>
                    {" • "}
                    <span className="text-emerald-400">+{change.summary.additions}</span>{" "}
                    <span className="text-red-400">-{change.summary.deletions}</span>
                  </>
                )}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        {selectedChange ? (
          <div>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedChange.title}</h2>
                <p className="text-sm text-zinc-500">{formatDate(selectedChange.updated)}</p>
              </div>
              <button
                onClick={() => window.open(`/api/sessions/${selectedChange.sessionId}/download`, "_blank")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Download ZIP
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {selectedChange.files.map((file) => (
                <button
                  key={file.file}
                  onClick={() => setSelectedFile(file)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${
                    selectedFile?.file === file.file
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {file.file.split("/").pop()}
                </button>
              ))}
            </div>

            {selectedFile && <DiffViewer file={selectedFile} />}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-400">Select a session to view changes</p>
          </div>
        )}
      </div>
    </div>
  );
}
