import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
const OPENCODE_DATA = path.join(process.env.HOME || '', '.local/share/opencode');
const SNAPSHOT_BASE = path.join(OPENCODE_DATA, 'snapshot');
const STORAGE_BASE = path.join(OPENCODE_DATA, 'storage');
function readJSON(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    catch {
        return null;
    }
}
function git(gitDir, args) {
    try {
        return execSync(`git --git-dir="${gitDir}" ${args}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
    }
    catch {
        return '';
    }
}
function getProjectGitDir(id) {
    return path.join(SNAPSHOT_BASE, id);
}
export function projectExists(id) {
    return fs.existsSync(getProjectGitDir(id));
}
function loadProjectById(id) {
    const gitDir = getProjectGitDir(id);
    if (!fs.existsSync(gitDir))
        return null;
    const projectInfo = readJSON(path.join(STORAGE_BASE, 'project', `${id}.json`));
    const sessionDir = path.join(STORAGE_BASE, 'session', id);
    const sessionDiffDir = path.join(STORAGE_BASE, 'session_diff');
    let sessions = [];
    let changeCount = 0;
    if (fs.existsSync(sessionDir)) {
        const sessionFiles = fs.readdirSync(sessionDir).filter((f) => f.endsWith('.json'));
        for (const f of sessionFiles) {
            const data = readJSON(path.join(sessionDir, f));
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
                    if (stat.size > 10)
                        changeCount++;
                }
            }
        }
        sessions.sort((a, b) => b.updated - a.updated);
    }
    return {
        id,
        worktree: projectInfo?.worktree || 'Unknown',
        name: projectInfo?.worktree ? path.basename(projectInfo.worktree) : 'Unknown',
        created: projectInfo?.time?.created || null,
        lastSession: sessions[0] || null,
        sessionCount: sessions.length,
        changeCount,
        gitDir,
    };
}
export function getProjects() {
    if (!fs.existsSync(SNAPSHOT_BASE))
        return [];
    return fs
        .readdirSync(SNAPSHOT_BASE)
        .filter((id) => {
        const stat = fs.statSync(path.join(SNAPSHOT_BASE, id));
        return stat.isDirectory();
    })
        .map((id) => loadProjectById(id))
        .filter((p) => p !== null)
        .sort((a, b) => (b.lastSession?.updated || 0) - (a.lastSession?.updated || 0));
}
export function getProject(id) {
    return loadProjectById(id);
}
export function getSessionChanges(projectId) {
    const sessionDir = path.join(STORAGE_BASE, 'session', projectId);
    const sessionDiffDir = path.join(STORAGE_BASE, 'session_diff');
    if (!fs.existsSync(sessionDir))
        return [];
    const changes = [];
    fs.readdirSync(sessionDir)
        .filter((f) => f.endsWith('.json'))
        .forEach((f) => {
        const session = readJSON(path.join(sessionDir, f));
        if (!session)
            return;
        const diffFile = path.join(sessionDiffDir, `${session.id}.json`);
        if (!fs.existsSync(diffFile))
            return;
        const diffs = readJSON(diffFile);
        if (!diffs || diffs.length === 0)
            return;
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
function extractTimestampFromId(id) {
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
export function getSnapshots(projectId) {
    const snapshots = [];
    const seenHashes = new Set();
    const projectSessions = new Set();
    const sessionTitles = new Map();
    const sessionDir = path.join(STORAGE_BASE, 'session', projectId);
    if (fs.existsSync(sessionDir)) {
        for (const f of fs.readdirSync(sessionDir).filter((f) => f.endsWith('.json'))) {
            const data = readJSON(path.join(sessionDir, f));
            if (data) {
                projectSessions.add(data.id);
                sessionTitles.set(data.id, data.title);
            }
        }
    }
    const partDir = path.join(STORAGE_BASE, 'part');
    if (!fs.existsSync(partDir))
        return snapshots;
    const messageDirs = fs.readdirSync(partDir).filter((d) => {
        try {
            return fs.statSync(path.join(partDir, d)).isDirectory();
        }
        catch {
            return false;
        }
    });
    for (const messageDir of messageDirs) {
        const messagePath = path.join(partDir, messageDir);
        let partFiles;
        try {
            partFiles = fs.readdirSync(messagePath).filter((f) => f.endsWith('.json'));
        }
        catch {
            continue;
        }
        for (const partFile of partFiles) {
            const partPath = path.join(messagePath, partFile);
            const part = readJSON(partPath);
            if (!part?.snapshot)
                continue;
            if (part.type !== 'step-start' && part.type !== 'step-finish')
                continue;
            if (!projectSessions.has(part.sessionID))
                continue;
            if (seenHashes.has(part.snapshot))
                continue;
            seenHashes.add(part.snapshot);
            let timestamp = part.time?.created || 0;
            if (!timestamp && part.id) {
                timestamp = extractTimestampFromId(part.id);
            }
            if (!timestamp) {
                try {
                    timestamp = fs.statSync(partPath).mtimeMs;
                }
                catch {
                    timestamp = 0;
                }
            }
            snapshots.push({
                hash: part.snapshot,
                timestamp,
                type: part.type,
                sessionId: part.sessionID,
                sessionTitle: sessionTitles.get(part.sessionID),
                messageId: part.messageID,
            });
        }
    }
    return snapshots.sort((a, b) => b.timestamp - a.timestamp);
}
export function getSnapshotFiles(projectId, hash) {
    const gitDir = getProjectGitDir(projectId);
    if (!fs.existsSync(gitDir))
        return [];
    const output = git(gitDir, `ls-tree -r "${hash}"`);
    if (!output)
        return [];
    return output
        .split('\n')
        .map((line) => {
        const match = line.match(/^(\d+)\s+(\w+)\s+([a-f0-9]+)\s+(.+)$/);
        if (!match)
            return null;
        return {
            mode: match[1],
            type: match[2],
            hash: match[3],
            path: match[4],
            name: path.basename(match[4]),
        };
    })
        .filter((f) => f !== null);
}
export function getFileContent(projectId, blobHash) {
    const gitDir = getProjectGitDir(projectId);
    if (!fs.existsSync(gitDir))
        return '';
    return git(gitDir, `cat-file -p "${blobHash}"`);
}
export function getSnapshotArchive(projectId, hash) {
    const gitDir = getProjectGitDir(projectId);
    if (!fs.existsSync(gitDir))
        return null;
    try {
        return execSync(`git --git-dir="${gitDir}" archive --format=zip "${hash}"`, {
            maxBuffer: 100 * 1024 * 1024,
        });
    }
    catch {
        return null;
    }
}
let searchIndex = null;
let sessionMetaCache = null;
let projectNameCache = null;
function buildSessionMetaCache() {
    if (sessionMetaCache)
        return sessionMetaCache;
    sessionMetaCache = new Map();
    const sessionBase = path.join(STORAGE_BASE, 'session');
    if (!fs.existsSync(sessionBase))
        return sessionMetaCache;
    for (const projectId of fs.readdirSync(sessionBase)) {
        const projectSessionDir = path.join(sessionBase, projectId);
        try {
            if (!fs.statSync(projectSessionDir).isDirectory())
                continue;
        }
        catch {
            continue;
        }
        for (const f of fs.readdirSync(projectSessionDir).filter((f) => f.endsWith('.json'))) {
            const data = readJSON(path.join(projectSessionDir, f));
            if (data) {
                sessionMetaCache.set(data.id, { title: data.title, projectId });
            }
        }
    }
    return sessionMetaCache;
}
function buildProjectNameCache() {
    if (projectNameCache)
        return projectNameCache;
    projectNameCache = new Map();
    const projectDir = path.join(STORAGE_BASE, 'project');
    if (!fs.existsSync(projectDir))
        return projectNameCache;
    for (const f of fs.readdirSync(projectDir).filter((f) => f.endsWith('.json'))) {
        const projectId = f.replace('.json', '');
        const data = readJSON(path.join(projectDir, f));
        if (data?.worktree) {
            projectNameCache.set(projectId, path.basename(data.worktree));
        }
    }
    return projectNameCache;
}
function buildSearchIndex() {
    if (searchIndex)
        return searchIndex;
    searchIndex = [];
    const sessionMeta = buildSessionMetaCache();
    const messageBase = path.join(STORAGE_BASE, 'message');
    const partBase = path.join(STORAGE_BASE, 'part');
    if (!fs.existsSync(partBase))
        return searchIndex;
    const messageDirs = fs.readdirSync(partBase).filter((d) => {
        try {
            return fs.statSync(path.join(partBase, d)).isDirectory();
        }
        catch {
            return false;
        }
    });
    for (const messageDir of messageDirs) {
        const messagePath = path.join(partBase, messageDir);
        let partFiles;
        try {
            partFiles = fs.readdirSync(messagePath).filter((f) => f.endsWith('.json'));
        }
        catch {
            continue;
        }
        for (const partFile of partFiles) {
            const part = readJSON(path.join(messagePath, partFile));
            if (!part || part.type !== 'text' || !part.text)
                continue;
            const meta = sessionMeta.get(part.sessionID);
            if (!meta)
                continue;
            let timestamp = part.time?.start || part.time?.end || 0;
            if (!timestamp) {
                timestamp = extractTimestampFromId(part.id);
            }
            let role = 'assistant';
            if (fs.existsSync(messageBase)) {
                const sessionMsgDir = path.join(messageBase, part.sessionID);
                if (fs.existsSync(sessionMsgDir)) {
                    const msgFile = path.join(sessionMsgDir, `${part.messageID}.json`);
                    const msgData = readJSON(msgFile);
                    if (msgData?.role === 'user')
                        role = 'user';
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
export function searchPrompts(query, limit = 50) {
    const index = buildSearchIndex();
    const sessionMeta = buildSessionMetaCache();
    const projectNames = buildProjectNameCache();
    const lowerQuery = query.toLowerCase();
    const results = [];
    for (const entry of index) {
        if (!entry.text.toLowerCase().includes(lowerQuery))
            continue;
        const meta = sessionMeta.get(entry.sessionId);
        if (!meta)
            continue;
        results.push({
            sessionId: entry.sessionId,
            sessionTitle: meta.title,
            projectId: meta.projectId,
            projectName: projectNames.get(meta.projectId) || 'Unknown',
            messageId: entry.messageId,
            text: entry.text,
            timestamp: entry.timestamp,
            role: entry.role,
        });
        if (results.length >= limit)
            break;
    }
    return results;
}
