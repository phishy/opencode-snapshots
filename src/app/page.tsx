import Link from "next/link";
import { getProjects } from "@/lib/opencode";

function formatDate(ts: number | null) {
  if (!ts) return "Unknown";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const projects = getProjects();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Projects</h1>

      {projects.length === 0 ? (
        <p className="text-zinc-400">No projects found.</p>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
            >
                <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{project.worktree}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-zinc-500">
                    <span className="text-zinc-300">{project.sessionCount}</span> sessions
                  </span>
                  <span className="text-zinc-500">
                    <span className="text-emerald-400">{project.changeCount}</span> with changes
                  </span>
                </div>
              </div>

              {project.lastSession && (
                <div className="mt-3 border-t border-zinc-800 pt-3">
                  <p className="text-sm text-zinc-400">
                    <span className="text-zinc-500">Last:</span>{" "}
                    <span className="text-zinc-300">{project.lastSession.title}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatDate(project.lastSession.updated)}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
