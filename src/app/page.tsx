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

function formatRelativeTime(ts: number | null) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function HomePage() {
  const projects = getProjects();

  return (
    <div>
      <h1 className="mb-6 text-xl font-medium text-oc-text-strong">Projects</h1>

      {projects.length === 0 ? (
        <p className="text-oc-text-weak">No projects found.</p>
      ) : (
        <div className="space-y-1">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-oc-bg-weak transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-oc-bg-elevated text-xs font-medium text-oc-text-base">
                  {project.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-medium text-oc-text-strong truncate">
                    {project.name}
                  </h2>
                  {project.lastSession && (
                    <p className="text-xs text-oc-text-weak truncate mt-0.5">
                      {project.lastSession.title}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs shrink-0">
                <span className="text-oc-text-weak">
                  {project.sessionCount} sessions
                </span>
                {project.changeCount > 0 && (
                  <span className="text-oc-green">
                    +{project.changeCount} changes
                  </span>
                )}
                {project.lastSession && (
                  <span className="text-oc-text-weak">
                    {formatRelativeTime(project.lastSession.updated)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
