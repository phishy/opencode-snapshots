# AGENTS.md - OpenCode Snapshot Browser

## Project Overview

A Next.js web UI to browse, view diffs, and recover files from [OpenCode](https://github.com/anomalyco/opencode) sessions. OpenCode captures snapshots before every AI step, storing them as git tree objects. This tool exposes that hidden history.

## Tech Stack

- **Framework**: Next.js 16 with App Router (server components by default)
- **Styling**: Tailwind CSS with custom `oc-*` color tokens (OpenCode brand colors)
- **Language**: TypeScript
- **Data**: Reads from `~/.local/share/opencode/` filesystem (no database)

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (all dynamic)
│   ├── projects/[id]/     # Project detail pages
│   ├── layout.tsx         # Root layout with nav
│   └── page.tsx           # Home page (project list)
└── lib/
    └── opencode.ts        # Data layer - ALL filesystem access here
```

## Critical Performance Guidelines

### The Golden Rule
**Never scan all projects when you only need one.**

### Data Layer (`src/lib/opencode.ts`)

This file contains ALL filesystem operations. When modifying:

1. **`getProject(id)`** - Loads a SINGLE project by ID. Does NOT call `getProjects()`.
2. **`getProjects()`** - Only used on the home page to list all projects.
3. **`projectExists(id)`** - Lightweight existence check (single `fs.existsSync`).
4. **`getProjectGitDir(id)`** - Returns git dir path without any I/O validation.

### Common Pitfalls to Avoid

```typescript
// BAD: Scans every project just to get one
export function getProject(id: string): Project | null {
  const projects = getProjects();  // Reads ALL projects!
  return projects.find((p) => p.id === id);
}

// GOOD: Direct lookup
export function getProject(id: string): Project | null {
  return loadProjectById(id);  // Reads only the requested project
}
```

```typescript
// BAD: Full project load just to check existence
const project = getProject(projectId);
if (!project) return 404;

// GOOD: Lightweight check
if (!projectExists(projectId)) return 404;
```

```typescript
// BAD: Full project load just to get gitDir
const project = getProject(projectId);
const output = git(project.gitDir, ...);

// GOOD: Direct path construction
const gitDir = getProjectGitDir(projectId);
const output = git(gitDir, ...);
```

### Why This Matters

OpenCode stores data across multiple directories:
- `~/.local/share/opencode/snapshot/{projectId}/` - Git bare repos
- `~/.local/share/opencode/storage/project/` - Project metadata
- `~/.local/share/opencode/storage/session/{projectId}/` - Session JSON files
- `~/.local/share/opencode/storage/session_diff/` - File diffs
- `~/.local/share/opencode/storage/part/` - Message parts with snapshot refs

A full `getProjects()` call reads ALL of these for EVERY project. With many projects/sessions, this causes noticeable delays.

### Function Complexity Guide

| Function | I/O Cost | When to Use |
|----------|----------|-------------|
| `projectExists(id)` | 1 fs.existsSync | Validation only |
| `getProjectGitDir(id)` | 0 (pure) | Need git dir path |
| `getProject(id)` | ~5-20 file reads | Need full project metadata |
| `getProjects()` | N × getProject | Home page only |
| `getSnapshots(projectId)` | Scans ALL 44k+ part files | **EXPENSIVE** - lazy load only |
| `getSessionChanges(projectId)` | Reads session + diff files | Changes tab |

### Lazy Loading Pattern

The `getSnapshots()` function scans ~44,000+ part files across all projects. **Never call it during initial page load.**

Current pattern (see `lazy-snapshot-browser.tsx`):
1. Server renders page WITHOUT snapshots
2. Client fetches `/api/projects/{id}/snapshots` only when "Snapshots" tab is selected
3. Results cached in memory for back/forward navigation

```typescript
// BAD: Blocks page render
const snapshots = getSnapshots(id);  // Scans 44k files!

// GOOD: Lazy load on client
<LazySnapshotBrowser projectId={id} />  // Fetches via API when needed
```

### Adding New Features

When adding features that need project data:

1. Ask: "Do I need the full `Project` object or just the `gitDir`?"
2. If just gitDir: use `getProjectGitDir(id)` + `fs.existsSync()` check
3. If full project: use `getProject(id)` (now optimized for single load)
4. Never call `getProjects()` except on the home page

## Styling

Uses OpenCode's official color palette from their UI package:

- Background: `#131010` (smoke-dark-1)
- Text: `#f1ecec` / `#b7b1b1` / `#716c6b` (strong/base/weak)
- Green: `#37db2e` (additions, success)
- Red: `#ff917b` (deletions, errors)
- Blue: `#89b5ff` (interactive, links)

All colors available as `bg-oc-*`, `text-oc-*`, `border-oc-*` Tailwind classes.

## Testing Changes

```bash
npm run build   # Type check + production build
npm run dev     # Development server
```

Build must pass before committing. No separate test suite currently.
