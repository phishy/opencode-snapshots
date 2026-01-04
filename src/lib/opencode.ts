import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const OPENCODE_DATA = path.join(process.env.HOME || "", ".local/share/opencode");
const SNAPSHOT_BASE = path.join(OPENCODE_DATA, "snapshot");
const STORAGE_BASE = path.join(OPENCODE_DATA, "storage");

export interface Project {
  id: string;
  name: string;
  worktree: string;
  created: number | null;
  lastSession: Session | null;
  sessionCount: number;
  changeCount: number;
  gitDir: string;
}

export interface Session {
  id: string;
  title: string;
  created: number;
  updated: number;
  snapshot?: string;
  summary?: {
    additions: number;
    deletions: number;
    files: number;
  };
}

export interface SessionChange {
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

export interface FileDiff {
  file: string;
  before: string;
  after: string;
}

export interface FileEntry {
  mode: string;
  type: string;
  hash: string;
  path: string;
  name: string;
}

export interface Snapshot {
  hash: string;
  timestamp: number;
  type: "step-start" | "step-finish";
  sessionId: string;
  sessionTitle?: string;
  messageId: string;
  fileCount?: number;
}

function readJSON<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function git(gitDir: string, args: string): string {
  try {
    return execSync(`git --git-dir="${gitDir}" ${args}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function getProjectGitDir(id: string): string {
  return path.join(SNAPSHOT_BASE, id);
}

export function projectExists(id: string): boolean {
  return fs.existsSync(getProjectGitDir(id));
}

function loadProjectById(id: string): Project | null {
  const gitDir = getProjectGitDir(id);
  if (!fs.existsSync(gitDir)) return null;

  const projectInfo = readJSON<{ worktree?: string; time?: { created?: number } }>(
    path.join(STORAGE_BASE, "project", `${id}.json`)
  );
  const sessionDir = path.join(STORAGE_BASE, "session", id);
  const sessionDiffDir = path.join(STORAGE_BASE, "session_diff");

  let sessions: Session[] = [];
  let changeCount = 0;

  if (fs.existsSync(sessionDir)) {
    const sessionFiles = fs.readdirSync(sessionDir).filter((f) => f.endsWith(".json"));
    for (const f of sessionFiles) {
      const data = readJSON<{
        id: string;
        title: string;
        time?: { created?: number; updated?: number };
        revert?: { snapshot?: string };
        summary?: { additions: number; deletions: number; files: number };
      }>(path.join(sessionDir, f));
      if (data) {
        sessions.push({
          id: data.id,
          title: data.title,
          created: data.time?.created || 0,
          updated: data.time?.updated || 0,
          snapshot: data.revert?.snapshot,
          summary: data.summary,
        });

        const diffFile = path.join(sessionDiffDir, `${data.id}.json`);
        if (fs.existsSync(diffFile)) {
          const stat = fs.statSync(diffFile);
          if (stat.size > 10) changeCount++;
        }
      }
    }
    sessions.sort((a, b) => b.updated - a.updated);
  }

  const lastSession = sessions[0] || null;

  return {
    id,
    worktree: projectInfo?.worktree || "Unknown",
    name: projectInfo?.worktree ? path.basename(projectInfo.worktree) : "Unknown",
    created: projectInfo?.time?.created || null,
    lastSession,
    sessionCount: sessions.length,
    changeCount,
    gitDir,
  };
}

export function getProjects(): Project[] {
  if (!fs.existsSync(SNAPSHOT_BASE)) return [];

  return fs
    .readdirSync(SNAPSHOT_BASE)
    .filter((id) => {
      const stat = fs.statSync(path.join(SNAPSHOT_BASE, id));
      return stat.isDirectory();
    })
    .map((id) => loadProjectById(id)!)
    .filter((p): p is Project => p !== null)
    .sort((a, b) => (b.lastSession?.updated || 0) - (a.lastSession?.updated || 0));
}

export function getProject(id: string): Project | null {
  return loadProjectById(id);
}

export function getSessionChanges(projectId: string): SessionChange[] {
  const sessionDir = path.join(STORAGE_BASE, "session", projectId);
  const sessionDiffDir = path.join(STORAGE_BASE, "session_diff");
  
  if (!fs.existsSync(sessionDir)) return [];

  const changes: SessionChange[] = [];

  fs.readdirSync(sessionDir)
    .filter((f) => f.endsWith(".json"))
    .forEach((f) => {
      const session = readJSON<{
        id: string;
        title: string;
        time?: { updated?: number };
        summary?: { additions: number; deletions: number; files: number };
      }>(path.join(sessionDir, f));

      if (!session) return;

      const diffFile = path.join(sessionDiffDir, `${session.id}.json`);
      if (!fs.existsSync(diffFile)) return;
      
      const diffs = readJSON<FileDiff[]>(diffFile);
      if (!diffs || diffs.length === 0) return;

      changes.push({
        sessionId: session.id,
        title: session.title,
        updated: session.time?.updated || 0,
        files: diffs,
        summary: session.summary,
      });
    });

  return changes.sort((a, b) => b.updated - a.updated);
}

export function getSessionDiff(sessionId: string): FileDiff[] {
  const diffFile = path.join(STORAGE_BASE, "session_diff", `${sessionId}.json`);
  if (!fs.existsSync(diffFile)) return [];
  return readJSON<FileDiff[]>(diffFile) || [];
}

export function getSessionInfo(sessionId: string): { projectId: string; session: Session } | null {
  const sessionDir = path.join(STORAGE_BASE, "session");
  if (!fs.existsSync(sessionDir)) return null;

  for (const projectId of fs.readdirSync(sessionDir)) {
    const projectSessionDir = path.join(sessionDir, projectId);
    const stat = fs.statSync(projectSessionDir);
    if (!stat.isDirectory()) continue;

    const sessionFile = path.join(projectSessionDir, `${sessionId}.json`);
    if (fs.existsSync(sessionFile)) {
      const data = readJSON<{
        id: string;
        title: string;
        time?: { created?: number; updated?: number };
        revert?: { snapshot?: string };
        summary?: { additions: number; deletions: number; files: number };
      }>(sessionFile);
      
      if (data) {
        return {
          projectId,
          session: {
            id: data.id,
            title: data.title,
            created: data.time?.created || 0,
            updated: data.time?.updated || 0,
            snapshot: data.revert?.snapshot,
            summary: data.summary,
          },
        };
      }
    }
  }
  return null;
}

export function getSnapshotFiles(projectId: string, hash: string): FileEntry[] {
  const gitDir = getProjectGitDir(projectId);
  if (!fs.existsSync(gitDir)) return [];

  const output = git(gitDir, `ls-tree -r "${hash}"`);
  if (!output) return [];

  return output.split("\n").map((line) => {
    const match = line.match(/^(\d+)\s+(\w+)\s+([a-f0-9]+)\s+(.+)$/);
    if (!match) return null;
    return {
      mode: match[1],
      type: match[2],
      hash: match[3],
      path: match[4],
      name: path.basename(match[4]),
    };
  }).filter((f): f is FileEntry => f !== null);
}

export function getFileContent(projectId: string, blobHash: string): string {
  const gitDir = getProjectGitDir(projectId);
  if (!fs.existsSync(gitDir)) return "";
  return git(gitDir, `cat-file -p "${blobHash}"`);
}

export function getSnapshotArchive(projectId: string, hash: string): Buffer | null {
  const gitDir = getProjectGitDir(projectId);
  if (!fs.existsSync(gitDir)) return null;

  try {
    return execSync(`git --git-dir="${gitDir}" archive --format=zip "${hash}"`, {
      maxBuffer: 100 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

export function getDiff(projectId: string, fromHash: string, toHash: string): string {
  const gitDir = getProjectGitDir(projectId);
  if (!fs.existsSync(gitDir)) return "";
  return git(gitDir, `diff "${fromHash}" "${toHash}"`);
}

export function getLatestSnapshot(projectId: string): string | null {
  const gitDir = getProjectGitDir(projectId);
  if (!fs.existsSync(gitDir)) return null;

  try {
    const hash = execSync(
      `git --git-dir="${gitDir}" write-tree`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
    return hash || null;
  } catch {
    return null;
  }
}

function extractTimestampFromId(id: string): number {
  const match = id.match(/^(?:prt|msg)_([a-f0-9]+)/);
  if (match) {
    const hex = match[1];
    const timestamp = parseInt(hex.slice(0, 11), 16);
    if (timestamp > 1600000000000 && timestamp < 2000000000000) {
      return timestamp;
    }
  }
  return 0;
}

export function getSnapshots(projectId: string): Snapshot[] {
  const snapshots: Snapshot[] = [];
  const seenHashes = new Set<string>();
  
  const projectSessions = new Set<string>();
  const sessionTitles = new Map<string, string>();
  const sessionDir = path.join(STORAGE_BASE, "session", projectId);
  if (fs.existsSync(sessionDir)) {
    for (const f of fs.readdirSync(sessionDir).filter((f) => f.endsWith(".json"))) {
      const data = readJSON<{ id: string; title: string }>(path.join(sessionDir, f));
      if (data) {
        projectSessions.add(data.id);
        sessionTitles.set(data.id, data.title);
      }
    }
  }

  const partDir = path.join(STORAGE_BASE, "part");
  if (!fs.existsSync(partDir)) return snapshots;

  const messageDirs = fs.readdirSync(partDir).filter((d) => {
    try {
      return fs.statSync(path.join(partDir, d)).isDirectory();
    } catch {
      return false;
    }
  });

  for (const messageDir of messageDirs) {
    const messagePath = path.join(partDir, messageDir);
    let partFiles: string[];
    try {
      partFiles = fs.readdirSync(messagePath).filter((f) => f.endsWith(".json"));
    } catch {
      continue;
    }

    for (const partFile of partFiles) {
      const partPath = path.join(messagePath, partFile);
      const part = readJSON<{
        id: string;
        sessionID: string;
        messageID: string;
        type: string;
        snapshot?: string;
        time?: { created?: number };
      }>(partPath);

      if (!part?.snapshot) continue;
      if (part.type !== "step-start" && part.type !== "step-finish") continue;
      if (!projectSessions.has(part.sessionID)) continue;
      if (seenHashes.has(part.snapshot)) continue;
      seenHashes.add(part.snapshot);

      let timestamp = part.time?.created || 0;
      if (!timestamp && part.id) {
        timestamp = extractTimestampFromId(part.id);
      }
      if (!timestamp) {
        try {
          timestamp = fs.statSync(partPath).mtimeMs;
        } catch {
          timestamp = 0;
        }
      }

      snapshots.push({
        hash: part.snapshot,
        timestamp,
        type: part.type as "step-start" | "step-finish",
        sessionId: part.sessionID,
        sessionTitle: sessionTitles.get(part.sessionID),
        messageId: part.messageID,
      });
    }
  }

  return snapshots.sort((a, b) => b.timestamp - a.timestamp);
}

export function getSnapshotFileCount(projectId: string, hash: string): number {
  const gitDir = getProjectGitDir(projectId);
  if (!fs.existsSync(gitDir)) return 0;

  const output = git(gitDir, `ls-tree -r "${hash}" | wc -l`);
  return parseInt(output.trim(), 10) || 0;
}

export function validateSnapshotHash(projectId: string, hash: string): boolean {
  const gitDir = getProjectGitDir(projectId);
  if (!fs.existsSync(gitDir)) return false;

  if (!/^[a-f0-9]{40}$/.test(hash)) return false;

  const type = git(gitDir, `cat-file -t "${hash}"`);
  return type === "tree";
}

export interface SearchResult {
  sessionId: string;
  sessionTitle: string;
  projectId: string;
  projectName: string;
  messageId: string;
  text: string;
  timestamp: number;
  role: "user" | "assistant";
  snapshot?: string;
}

interface SearchIndexEntry {
  sessionId: string;
  projectId: string;
  messageId: string;
  text: string;
  timestamp: number;
  role: "user" | "assistant";
}

let searchIndex: SearchIndexEntry[] | null = null;
let sessionMetaCache: Map<string, { title: string; projectId: string }> | null = null;
let projectNameCache: Map<string, string> | null = null;

function buildSessionMetaCache(): Map<string, { title: string; projectId: string }> {
  if (sessionMetaCache) return sessionMetaCache;
  
  sessionMetaCache = new Map();
  const sessionBase = path.join(STORAGE_BASE, "session");
  if (!fs.existsSync(sessionBase)) return sessionMetaCache;

  for (const projectId of fs.readdirSync(sessionBase)) {
    const projectSessionDir = path.join(sessionBase, projectId);
    try {
      if (!fs.statSync(projectSessionDir).isDirectory()) continue;
    } catch {
      continue;
    }

    for (const f of fs.readdirSync(projectSessionDir).filter((f) => f.endsWith(".json"))) {
      const data = readJSON<{ id: string; title: string }>(path.join(projectSessionDir, f));
      if (data) {
        sessionMetaCache.set(data.id, { title: data.title, projectId });
      }
    }
  }

  return sessionMetaCache;
}

function buildProjectNameCache(): Map<string, string> {
  if (projectNameCache) return projectNameCache;

  projectNameCache = new Map();
  const projectDir = path.join(STORAGE_BASE, "project");
  if (!fs.existsSync(projectDir)) return projectNameCache;

  for (const f of fs.readdirSync(projectDir).filter((f) => f.endsWith(".json"))) {
    const projectId = f.replace(".json", "");
    const data = readJSON<{ worktree?: string }>(path.join(projectDir, f));
    if (data?.worktree) {
      projectNameCache.set(projectId, path.basename(data.worktree));
    }
  }

  return projectNameCache;
}

function buildSearchIndex(): SearchIndexEntry[] {
  if (searchIndex) return searchIndex;

  searchIndex = [];
  const sessionMeta = buildSessionMetaCache();
  const messageBase = path.join(STORAGE_BASE, "message");
  const partBase = path.join(STORAGE_BASE, "part");

  if (!fs.existsSync(partBase)) return searchIndex;

  const messageDirs = fs.readdirSync(partBase).filter((d) => {
    try {
      return fs.statSync(path.join(partBase, d)).isDirectory();
    } catch {
      return false;
    }
  });

  for (const messageDir of messageDirs) {
    const messagePath = path.join(partBase, messageDir);
    let partFiles: string[];
    try {
      partFiles = fs.readdirSync(messagePath).filter((f) => f.endsWith(".json"));
    } catch {
      continue;
    }

    for (const partFile of partFiles) {
      const part = readJSON<{
        id: string;
        sessionID: string;
        messageID: string;
        type: string;
        text?: string;
        time?: { start?: number; end?: number };
      }>(path.join(messagePath, partFile));

      if (!part || part.type !== "text" || !part.text) continue;

      const meta = sessionMeta.get(part.sessionID);
      if (!meta) continue;

      let timestamp = part.time?.start || part.time?.end || 0;
      if (!timestamp) {
        timestamp = extractTimestampFromId(part.id);
      }

      let role: "user" | "assistant" = "assistant";
      if (fs.existsSync(messageBase)) {
        const sessionMsgDir = path.join(messageBase, part.sessionID);
        if (fs.existsSync(sessionMsgDir)) {
          const msgFile = path.join(sessionMsgDir, `${part.messageID}.json`);
          const msgData = readJSON<{ role?: string }>(msgFile);
          if (msgData?.role === "user") role = "user";
        }
      }

      searchIndex.push({
        sessionId: part.sessionID,
        projectId: meta.projectId,
        messageId: part.messageID,
        text: part.text,
        timestamp,
        role,
      });
    }
  }

  searchIndex.sort((a, b) => b.timestamp - a.timestamp);
  return searchIndex;
}

export function searchPrompts(query: string, limit = 50): SearchResult[] {
  const index = buildSearchIndex();
  const sessionMeta = buildSessionMetaCache();
  const projectNames = buildProjectNameCache();
  const lowerQuery = query.toLowerCase();

  const results: SearchResult[] = [];

  for (const entry of index) {
    if (!entry.text.toLowerCase().includes(lowerQuery)) continue;

    const meta = sessionMeta.get(entry.sessionId);
    if (!meta) continue;

    results.push({
      sessionId: entry.sessionId,
      sessionTitle: meta.title,
      projectId: meta.projectId,
      projectName: projectNames.get(meta.projectId) || "Unknown",
      messageId: entry.messageId,
      text: entry.text,
      timestamp: entry.timestamp,
      role: entry.role,
    });

    if (results.length >= limit) break;
  }

  return results;
}

export function getSnapshotForMessage(sessionId: string, messageId: string): string | null {
  const partBase = path.join(STORAGE_BASE, "part");
  const messagePath = path.join(partBase, messageId);

  if (!fs.existsSync(messagePath)) return null;

  let partFiles: string[];
  try {
    partFiles = fs.readdirSync(messagePath).filter((f) => f.endsWith(".json"));
  } catch {
    return null;
  }

  for (const partFile of partFiles) {
    const part = readJSON<{
      sessionID: string;
      type: string;
      snapshot?: string;
    }>(path.join(messagePath, partFile));

    if (part?.sessionID === sessionId && part?.snapshot) {
      return part.snapshot;
    }
  }

  return null;
}

export function getSearchIndexStats(): { indexed: boolean; count: number } {
  return {
    indexed: searchIndex !== null,
    count: searchIndex?.length || 0,
  };
}
