# OpenCode Snapshot Browser

A web UI to browse, view diffs, and export file changes made by [OpenCode](https://github.com/opencode-ai/opencode) sessions.

![Screenshot](screenshot.png)

## Features

- Browse all OpenCode projects with session counts
- View file changes from each coding session
- Side-by-side diff viewer with before/after toggle
- Export session changes as ZIP files

## Installation

```bash
npm install
```

## Usage

```bash
npm run dev
```

Open http://localhost:3000

## How It Works

OpenCode stores session data in `~/.local/share/opencode/`:

```
~/.local/share/opencode/
├── storage/
│   ├── project/          # Project metadata (worktree paths, timestamps)
│   ├── session/          # Session metadata (titles, summaries)
│   └── session_diff/     # Before/after file contents per session
└── snapshot/             # Git object storage for revert snapshots
```

This tool reads from `session_diff/` to display the actual file changes made during each OpenCode session. Each session diff contains the complete before and after state of modified files.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **ZIP Export**: archiver

## Project Structure

```
├── src/
│   ├── app/            # Pages and API routes
│   └── lib/            # OpenCode data access
├── package.json
└── README.md
```

## API Routes

| Route | Description |
|-------|-------------|
| `GET /api/projects` | List all projects |
| `GET /api/projects/[id]/changes` | Get session changes for a project |
| `GET /api/sessions/[sessionId]/download` | Download session changes as ZIP |

## License

MIT
