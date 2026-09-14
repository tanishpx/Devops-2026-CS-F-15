import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBugs,
  updateBug,
  deleteBug,
  type Bug,
  type BugFilters,
} from "../../lib/api";
import {
  SEVERITIES,
  PRIORITIES,
  BUG_STATUSES,
  type BugStatus,
} from "../../lib/forms";
import { useToast } from "../../components/Toast";
import Skeleton from "../../components/Skeleton";

type SortKey = "newest" | "oldest" | "severity" | "priority";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "severity", label: "Severity" },
  { value: "priority", label: "Priority" },
];

const SEV_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const PRI_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function sortBugs(bugs: Bug[], sort: SortKey): Bug[] {
  const sorted = [...bugs];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "oldest":
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case "severity":
      return sorted.sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));
    case "priority":
      return sorted.sort((a, b) => (PRI_ORDER[a.priority] ?? 9) - (PRI_ORDER[b.priority] ?? 9));
    default:
      return sorted;
  }
}

function copyAsJSON(bug: Bug) {
  const ctx = {
    title: bug.title,
    description: bug.description,
    bugType: bug.bugType,
    severity: bug.severity,
    priority: bug.priority,
    status: bug.status,
    assignee: bug.assignee,
    environment: bug.environment,
    tags: bug.tags,
    createdAt: bug.createdAt,
    formId: bug.formId,
  };
  navigator.clipboard.writeText(JSON.stringify(ctx, null, 2));
}

function copyAsMarkdown(bug: Bug) {
  const md = `# ${bug.title}

**Status:** ${bug.status} | **Severity:** ${bug.severity} | **Priority:** ${bug.priority}
**Type:** ${bug.bugType} | **Assignee:** ${bug.assignee || "Unassigned"}

## Description
${bug.description || "No description provided."}

## Environment
${bug.environment || "Not specified."}

## Tags
${bug.tags?.length ? bug.tags.map((t) => `\`${t}\``).join(", ") : "None"}

---
*Form ID: ${bug.formId} | Created: ${new Date(bug.createdAt).toLocaleString()}*`;
  navigator.clipboard.writeText(md);
}

export default function Bugs() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BugFilters>({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<"json" | "md" | null>(null);
  const { addToast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const loadBugs = useCallback(async () => {
    try {
      const data = await getBugs({ ...filters, search: debouncedSearch || undefined });
      setBugs(data);
    } catch (err) {
      console.error("Failed to load bugs:", err);
      addToast("Failed to load bugs", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, addToast]);

  useEffect(() => { loadBugs(); }, [loadBugs]);

  const handleStatusChange = async (formId: string, status: BugStatus) => {
    try {
      const updated = await updateBug(formId, { status });
      setBugs((prev) => prev.map((b) => (b.formId === formId ? updated : b)));
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (formId: string) => {
    if (!window.confirm("Delete this bug?")) return;
    try {
      await deleteBug(formId);
      setBugs((prev) => prev.filter((b) => b.formId !== formId));
      addToast("Bug deleted", "success");
    } catch (err) {
      addToast("Failed to delete", "error");
    }
  };

  const copyContext = (bug: Bug, format: "json" | "md") => {
    if (format === "json") copyAsJSON(bug);
    else copyAsMarkdown(bug);
    setCopiedId(bug.formId);
    setCopiedFormat(format);
    addToast(`Copied as ${format.toUpperCase()}`, "success");
    setTimeout(() => { setCopiedId(null); setCopiedFormat(null); }, 2000);
  };

  const sorted = sortBugs(bugs, sort);
  const counts = {
    total: bugs.length,
    open: bugs.filter((b) => b.status === "Open").length,
    inProgress: bugs.filter((b) => b.status === "In Progress").length,
    critical: bugs.filter((b) => b.severity === "Critical").length,
    fixed: bugs.filter((b) => b.status === "Fixed").length,
  };

  if (loading) {
    return (
      <div className="bg">
        <div className="bg-header">
          <div>
            <h1 className="bg-title">Bugs</h1>
            <p className="bg-sub">AI-ready bug context packages</p>
          </div>
        </div>
        <Skeleton type="card" />
      </div>
    );
  }

  return (
    <div className="bg">
      <div className="bg-header">
        <div>
          <h1 className="bg-title">Bugs</h1>
          <p className="bg-sub">Structured context for AI-assisted resolution</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bg-stats">
        <div className="bg-stat">
          <span className="bg-stat-value">{counts.total}</span>
          <span className="bg-stat-label">Total</span>
        </div>
        <div className="bg-stat">
          <span className="bg-stat-value">{counts.open}</span>
          <span className="bg-stat-label">Open</span>
        </div>
        <div className="bg-stat">
          <span className="bg-stat-value">{counts.inProgress}</span>
          <span className="bg-stat-label">In Progress</span>
        </div>
        <div className="bg-stat">
          <span className="bg-stat-value">{counts.critical}</span>
          <span className="bg-stat-label">Critical</span>
        </div>
        <div className="bg-stat">
          <span className="bg-stat-value">{counts.fixed}</span>
          <span className="bg-stat-label">Fixed</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-toolbar">
        <input
          className="bg-search"
          type="search"
          placeholder="Search bugs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="bg-select"
          value={filters.status || ""}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
        >
          <option value="">All Status</option>
          {BUG_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          className="bg-select"
          value={filters.severity || ""}
          onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value || undefined }))}
        >
          <option value="">All Severity</option>
          {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          className="bg-select"
          value={filters.priority || ""}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value || undefined }))}
        >
          <option value="">All Priority</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select
          className="bg-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Bug Cards */}
      {sorted.length === 0 ? (
        <div className="bg-empty">
          <div className="bg-empty-icon"><i className="fa-solid fa-bug" /></div>
          <h3>No bugs found</h3>
          <p>{search || Object.keys(filters).length ? "Try adjusting your filters." : "Bugs will appear here after submissions are accepted."}</p>
        </div>
      ) : (
        <div className="bg-cards">
          {sorted.map((b) => (
            <div className="bg-card" key={b.formId}>
              <div className="bg-card-header">
                <div className="bg-card-title-row">
                  <h3 className="bg-card-title">{b.title}</h3>
                  <span className={`bg-card-status bg-status-${b.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {b.status}
                  </span>
                </div>
                <div className="bg-card-meta">
                  <span className={`bg-badge bg-sev-${b.severity.toLowerCase()}`}>{b.severity}</span>
                  <span className="bg-badge">{b.bugType}</span>
                  <span className="bg-badge">{b.priority}</span>
                  {b.assignee && b.assignee !== "Unassigned" && (
                    <span className="bg-badge">{b.assignee}</span>
                  )}
                </div>
              </div>

              {b.description && (
                <p className="bg-card-desc">{b.description}</p>
              )}

              {b.environment && (
                <div className="bg-card-env">
                  <span className="bg-env-label">Environment</span>
                  <span className="bg-env-value">{b.environment}</span>
                </div>
              )}

              {b.tags && b.tags.length > 0 && (
                <div className="bg-card-tags">
                  {b.tags.map((t) => <span key={t} className="bg-tag">#{t}</span>)}
                </div>
              )}

              <div className="bg-card-footer">
                <div className="bg-card-actions-left">
                  <select
                    className="bg-status-select"
                    value={b.status}
                    onChange={(e) => handleStatusChange(b.formId, e.target.value as BugStatus)}
                  >
                    {BUG_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button className="bg-action" onClick={() => handleDelete(b.formId)}>
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
                <div className="bg-card-actions-right">
                  <button
                    className={`bg-copy-btn ${copiedId === b.formId && copiedFormat === "json" ? "copied" : ""}`}
                    onClick={() => copyContext(b, "json")}
                    title="Copy as JSON for MCP"
                  >
                    <i className={copiedId === b.formId && copiedFormat === "json" ? "fa-solid fa-check" : "fa-solid fa-code"} />
                    JSON
                  </button>
                  <button
                    className={`bg-copy-btn ${copiedId === b.formId && copiedFormat === "md" ? "copied" : ""}`}
                    onClick={() => copyContext(b, "md")}
                    title="Copy as Markdown"
                  >
                    <i className={copiedId === b.formId && copiedFormat === "md" ? "fa-solid fa-check" : "fa-solid fa-file-lines"} />
                    MD
                  </button>
                  <a
                    href={`/#/feedback/${b.formId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-action"
                    title="Open form"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                  </a>
                </div>
              </div>

              <div className="bg-card-time">
                {new Date(b.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
