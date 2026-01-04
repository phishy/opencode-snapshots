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

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "1d ago";
  return `${days}d ago`;
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
    <div className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak overflow-hidden min-w-0">
      <div className="flex items-center justify-between border-b border-oc-border-subtle px-4 py-2">
        <span className="font-mono text-sm text-oc-text-base">{file.file}</span>
        <div className="flex items-center gap-2">
          {isNew && <span className="rounded bg-oc-green/20 px-2 py-0.5 text-xs text-oc-green">new</span>}
          {isDeleted && <span className="rounded bg-oc-red/20 px-2 py-0.5 text-xs text-oc-red">deleted</span>}
          {!isNew && !isDeleted && (
            <div className="flex rounded-lg bg-oc-bg-base p-0.5 text-xs">
              <button
                onClick={() => setViewMode("diff")}
                className={`rounded px-2 py-1 transition-colors ${viewMode === "diff" ? "bg-oc-bg-elevated text-oc-text-strong" : "text-oc-text-weak hover:text-oc-text-base"}`}
              >
                Diff
              </button>
              <button
                onClick={() => setViewMode("before")}
                className={`rounded px-2 py-1 transition-colors ${viewMode === "before" ? "bg-oc-bg-elevated text-oc-text-strong" : "text-oc-text-weak hover:text-oc-text-base"}`}
              >
                Before
              </button>
              <button
                onClick={() => setViewMode("after")}
                className={`rounded px-2 py-1 transition-colors ${viewMode === "after" ? "bg-oc-bg-elevated text-oc-text-strong" : "text-oc-text-weak hover:text-oc-text-base"}`}
              >
                After
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="max-h-[400px] overflow-auto">
        <pre className="text-xs leading-relaxed min-w-0 font-mono">
          {viewMode === "diff" ? (
            computeDiff(file.before, file.after).map((line, i) => {
              let className = "px-4 py-0.5 block ";
              if (line.startsWith("+")) {
                className += "text-oc-green bg-oc-green/10";
              } else if (line.startsWith("-")) {
                className += "text-oc-red bg-oc-red/10";
              } else {
                className += "text-oc-text-weak";
              }
              return <code key={i} className={className}>{line || " "}</code>;
            })
          ) : viewMode === "before" ? (
            file.before.split("\n").map((line, i) => (
              <code key={i} className="px-4 py-0.5 block text-oc-text-weak">{line || " "}</code>
            ))
          ) : (
            file.after.split("\n").map((line, i) => (
              <code key={i} className="px-4 py-0.5 block text-oc-text-weak">{line || " "}</code>
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
    <div className="grid gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
      <div>
        <h2 className="mb-2 text-sm font-medium text-oc-text-strong">Sessions with Changes</h2>
        <p className="mb-3 text-xs text-oc-text-weak">
          Click to view file changes from each session.
        </p>
        <div className="space-y-1 max-h-[600px] overflow-auto">
          {changes.map((change) => (
            <button
              key={change.sessionId}
              onClick={() => selectChange(change)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selectedChange?.sessionId === change.sessionId
                  ? "border-oc-blue/50 bg-oc-blue/10"
                  : "border-oc-border-subtle bg-oc-bg-weak hover:border-oc-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-oc-text-strong truncate">{change.title}</p>
                <span className="text-xs text-oc-text-weak shrink-0">{formatRelativeTime(change.updated)}</span>
              </div>
              <p className="mt-1 text-xs">
                <span className="text-oc-text-weak">{change.files.length} files</span>
                {change.summary && (
                  <>
                    {" "}
                    <span className="text-oc-green">+{change.summary.additions}</span>{" "}
                    <span className="text-oc-red">-{change.summary.deletions}</span>
                  </>
                )}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        {selectedChange ? (
          <div>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-medium text-oc-text-strong">{selectedChange.title}</h2>
                <p className="text-xs text-oc-text-weak">{formatDate(selectedChange.updated)}</p>
              </div>
              <button
                onClick={() => window.open(`/api/sessions/${selectedChange.sessionId}/download`, "_blank")}
                className="rounded-lg bg-oc-green/20 border border-oc-green/30 px-4 py-2 text-sm font-medium text-oc-green transition-colors hover:bg-oc-green/30"
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
                      ? "border-oc-blue/50 bg-oc-blue/10 text-oc-blue"
                      : "border-oc-border-subtle bg-oc-bg-weak text-oc-text-weak hover:border-oc-border"
                  }`}
                >
                  {file.file.split("/").pop()}
                </button>
              ))}
            </div>

            {selectedFile && <DiffViewer file={selectedFile} />}
          </div>
        ) : (
          <div className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak p-8 text-center">
            <p className="text-oc-text-weak">Select a session to view changes</p>
          </div>
        )}
      </div>
    </div>
  );
}
