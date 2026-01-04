"use client";

import Link from "next/link";

interface Props {
  activeTab: string;
  projectId: string;
}

export function ProjectTabs({ activeTab, projectId }: Props) {
  const tabs = [
    { id: "changes", label: "Session Changes" },
    { id: "snapshots", label: "Snapshot Browser" },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-oc-bg-weak p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`/projects/${projectId}?tab=${tab.id}`}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-oc-bg-elevated text-oc-text-strong"
              : "text-oc-text-weak hover:text-oc-text-base"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
