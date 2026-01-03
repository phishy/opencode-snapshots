import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getSessionChanges, getSnapshots, getLatestSnapshot } from "@/lib/opencode";
import { ChangeBrowser } from "./change-browser";
import { SnapshotBrowser } from "./snapshot-browser";
import { ProjectTabs } from "./project-tabs";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab = "changes" } = await searchParams;
  const project = getProject(id);

  if (!project) {
    notFound();
  }

  const changes = getSessionChanges(id);
  const snapshots = getSnapshots(id);
  const latestSnapshot = getLatestSnapshot(id);

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-300">
          &larr; Back to projects
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="mt-1 text-zinc-400">{project.worktree}</p>
        <div className="mt-2 flex gap-4 text-sm text-zinc-500">
          <span>
            <span className="text-zinc-300">{project.sessionCount}</span> sessions
          </span>
          <span>
            <span className="text-emerald-400">{changes.length}</span> with changes
          </span>
          <span>
            <span className="text-blue-400">{snapshots.length}</span> snapshots
          </span>
        </div>
      </div>

      <ProjectTabs activeTab={tab} projectId={id} />

      <div className="mt-6">
        {tab === "changes" ? (
          changes.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400">No file changes recorded for this project.</p>
              <p className="mt-2 text-sm text-zinc-500">
                Changes are recorded when OpenCode modifies files during a session.
              </p>
            </div>
          ) : (
            <ChangeBrowser projectId={id} changes={changes} />
          )
        ) : (
          <SnapshotBrowser
            projectId={id}
            latestSnapshot={latestSnapshot}
            snapshots={snapshots}
          />
        )}
      </div>
    </div>
  );
}
