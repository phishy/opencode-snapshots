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

export function getProjects(): Project[] {
  if (!fs.existsSync(SNAPSHOT_BASE)) return [];

  return fs
    .readdirSync(SNAPSHOT_BASE)
    .filter((id) => {
      const stat = fs.statSync(path.join(SNAPSHOT_BASE, id));
      return stat.isDirectory();
    })
    .map((id) => {
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
        gitDir: path.join(SNAPSHOT_BASE, id),
      };
    })
    .sort((a, b) => (b.lastSession?.updated || 0) - (a.lastSession?.updated || 0));
}

export function getProject(id: string): Project | null {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
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

export function getSnapshotFiles(projectId: string, hash: string): FileEntry[] {
  const project = getProject(projectId);
  if (!project) return [];

  const output = git(project.gitDir, `ls-tree -r "${hash}"`);
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
  const project = getProject(projectId);
  if (!project) return "";
  return git(project.gitDir, `cat-file -p "${blobHash}"`);
}

export function getSnapshotArchive(projectId: string, hash: string): Buffer | null {
  const project = getProject(projectId);
  if (!project) return null;

  try {
    return execSync(`git --git-dir="${project.gitDir}" archive --format=zip "${hash}"`, {
      maxBuffer: 100 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

export function getDiff(projectId: string, fromHash: string, toHash: string): string {
  const project = getProject(projectId);
  if (!project) return "";
  return git(project.gitDir, `diff "${fromHash}" "${toHash}"`);
}
