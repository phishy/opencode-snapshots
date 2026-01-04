import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getSessionChanges, getLatestSnapshot } from "@/lib/opencode";
import { ChangeBrowser } from "./change-browser";
import { LazySnapshotBrowser } from "./lazy-snapshot-browser";
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
  const latestSnapshot = tab === "snapshots" ? getLatestSnapshot(id) : null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-oc-text-weak hover:text-oc-text-base transition-colors">
          &larr; Back to projects
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-medium text-oc-text-strong">{project.name}</h1>
        <p className="mt-1 text-sm text-oc-text-weak">{project.worktree}</p>
        <div className="mt-3 flex gap-6 text-sm">
          <span className="text-oc-text-weak">
            <span className="text-oc-text-base">{project.sessionCount}</span> sessions
          </span>
          <span className="text-oc-text-weak">
            <span className="text-oc-green">{changes.length}</span> with changes
          </span>
        </div>
      </div>

      <ProjectTabs activeTab={tab} projectId={id} />

      <div className="mt-6">
        {tab === "changes" ? (
          changes.length === 0 ? (
            <div className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak p-8 text-center">
              <p className="text-oc-text-base">No file changes recorded for this project.</p>
              <p className="mt-2 text-sm text-oc-text-weak">
                Changes are recorded when OpenCode modifies files during a session.
              </p>
            </div>
          ) : (
            <ChangeBrowser projectId={id} changes={changes} />
          )
        ) : (
          <LazySnapshotBrowser
            projectId={id}
            latestSnapshot={latestSnapshot}
          />
        )}
      </div>
    </div>
  );
}
