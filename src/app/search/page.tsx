"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface SearchResult {
  sessionId: string;
  sessionTitle: string;
  projectId: string;
  projectName: string;
  messageId: string;
  text: string;
  timestamp: number;
  role: "user" | "assistant";
  snapshot?: string;
}

function formatRelativeTime(ts: number) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-oc-brand/30 text-oc-text-strong rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function truncateText(text: string, query: string, maxLength = 200) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1 || text.length <= maxLength) {
    return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
  }

  const start = Math.max(0, matchIndex - 60);
  const end = Math.min(text.length, matchIndex + query.length + 100);

  let result = text.slice(start, end);
  if (start > 0) result = "..." + result;
  if (end < text.length) result = result + "...";

  return result;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [indexing, setIndexing] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=100`);
      const data = await res.json();
      setResults(data.results || []);
      setIndexing(false);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.length >= 2) {
        search(query);
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, search]);

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-oc-text-weak hover:text-oc-text-base transition-colors">
          &larr; Back to projects
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-xl font-medium text-oc-text-strong mb-4">Search Conversations</h1>
        <p className="text-sm text-oc-text-weak mb-4">
          Find snapshots by searching through your prompts and AI responses.
        </p>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts... (e.g., 'authentication', 'refactor navbar')"
            className="w-full rounded-lg border border-oc-border bg-oc-bg-weak px-4 py-3 text-oc-text-strong placeholder:text-oc-text-weak focus:border-oc-blue focus:outline-none focus:ring-1 focus:ring-oc-blue"
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-oc-text-weak border-t-oc-blue" />
            </div>
          )}
        </div>
      </div>

      {indexing && (
        <div className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak p-4 mb-6">
          <p className="text-sm text-oc-text-base">Building search index... This only happens once.</p>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak p-8 text-center">
          <p className="text-oc-text-base">No results found for "{query}"</p>
          <p className="text-sm text-oc-text-weak mt-2">Try different keywords</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-oc-text-weak mb-4">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((result, i) => (
            <div
              key={`${result.messageId}-${i}`}
              className="rounded-lg border border-oc-border-subtle bg-oc-bg-weak p-4 hover:border-oc-border transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                      result.role === "user"
                        ? "bg-oc-blue/20 text-oc-blue"
                        : "bg-oc-green/20 text-oc-green"
                    }`}
                  >
                    {result.role}
                  </span>
                  <Link
                    href={`/projects/${result.projectId}`}
                    className="text-sm font-medium text-oc-text-strong hover:text-oc-blue truncate"
                  >
                    {result.projectName}
                  </Link>
                  <span className="text-oc-text-weak">·</span>
                  <span className="text-sm text-oc-text-weak truncate">{result.sessionTitle}</span>
                </div>
                <span className="text-xs text-oc-text-weak shrink-0">
                  {formatRelativeTime(result.timestamp)}
                </span>
              </div>

              <p className="text-sm text-oc-text-base leading-relaxed mb-3">
                {highlightMatch(truncateText(result.text, query), query)}
              </p>

              {result.snapshot && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/projects/${result.projectId}?tab=snapshots`}
                    className="text-xs text-oc-blue hover:underline"
                  >
                    Browse snapshot
                  </Link>
                  <span className="text-oc-text-weak">·</span>
                  <a
                    href={`/api/snapshots/${result.projectId}/${result.snapshot}/download`}
                    className="text-xs text-oc-green hover:underline"
                  >
                    Download ZIP
                  </a>
                  <span className="text-oc-text-weak">·</span>
                  <span className="text-xs text-oc-text-weak font-mono">
                    {result.snapshot.slice(0, 8)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
