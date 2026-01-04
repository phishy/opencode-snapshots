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
export interface Snapshot {
    hash: string;
    timestamp: number;
    type: 'step-start' | 'step-finish';
    sessionId: string;
    sessionTitle?: string;
    messageId: string;
}
export interface FileEntry {
    mode: string;
    type: string;
    hash: string;
    path: string;
    name: string;
}
export declare function projectExists(id: string): boolean;
export declare function getProjects(): Project[];
export declare function getProject(id: string): Project | null;
export declare function getSessionChanges(projectId: string): SessionChange[];
export declare function getSnapshots(projectId: string): Snapshot[];
export declare function getSnapshotFiles(projectId: string, hash: string): FileEntry[];
export declare function getFileContent(projectId: string, blobHash: string): string;
export declare function getSnapshotArchive(projectId: string, hash: string): Buffer | null;
export interface SearchResult {
    sessionId: string;
    sessionTitle: string;
    projectId: string;
    projectName: string;
    messageId: string;
    text: string;
    timestamp: number;
    role: 'user' | 'assistant';
}
export declare function searchPrompts(query: string, limit?: number): SearchResult[];
