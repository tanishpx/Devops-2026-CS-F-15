import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBugs,
  updateBug,
  deleteBug,
  type Bug,
  type BugFilters,
} from "../../lib/api";
import {
  BUG_TYPES,
  SEVERITIES,
  PRIORITIES,
  BUG_STATUSES,
  type BugType,
  type Severity,
  type Priority,
  type BugStatus,
} from "../../lib/forms";
import { useToast } from "../../components/Toast";
import Skeleton from "../../components/Skeleton";

export default function BugDashboard() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BugFilters>({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [editTagInput, setEditTagInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const { addToast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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

  useEffect(() => {
    loadBugs();
  }, [loadBugs]);

  const handleStatusChange = async (formId: string, status: BugStatus) => {
    try {
      const updated = await updateBug(formId, { status });
      setBugs((prev) => prev.map((b) => (b.formId === formId ? updated : b)));
    } catch (err) {
      console.error("Failed to update status:", err);
      addToast("Failed to update status", "error");
    }
  };

  const startEditing = (bug: Bug) => {
    setEditingBug({ ...bug });
    setEditTagInput((bug.tags || []).join(", "));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBug || !editingBug.title.trim() || savingEdit) return;

    setSavingEdit(true);
    try {
      const updatedTags = editTagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const updated = await updateBug(editingBug.formId, {
        title: editingBug.title.trim(),
        description: editingBug.description || "",
        bugType: editingBug.bugType,
        severity: editingBug.severity,
        priority: editingBug.priority,
        status: editingBug.status,
        assignee: editingBug.assignee || "Unassigned",
        environment: editingBug.environment || "",
        tags: updatedTags,
      });

      setBugs((prev) =>
        prev.map((b) => (b.formId === editingBug.formId ? updated : b))
      );
      setEditingBug(null);
      addToast("Bug updated successfully", "success");
    } catch (err) {
      console.error("Failed to update bug:", err);
      addToast("Failed to update bug", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (formId: string) => {
    if (!window.confirm("Are you sure you want to delete this bug?")) return;
    try {
      await deleteBug(formId);
      setBugs((prev) => prev.filter((b) => b.formId !== formId));
      if (editingBug?.formId === formId) setEditingBug(null);
      addToast("Bug deleted", "success");
    } catch (err) {
      console.error("Failed to delete bug:", err);
      addToast("Failed to delete bug", "error");
    }
  };

  const toggleSelect = (formId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(formId)) {
        next.delete(formId);
      } else {
        next.add(formId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === bugs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(bugs.map((b) => b.formId)));
    }
  };

  const bulkStatusChange = async (status: BugStatus) => {
    const count = selected.size;
    for (const formId of selected) {
      try {
        const updated = await updateBug(formId, { status });
        setBugs((prev) =>
          prev.map((b) => (b.formId === formId ? updated : b))
        );
      } catch (err) {
        console.error(`Failed to update ${formId}:`, err);
      }
    }
    setSelected(new Set());
    addToast(`${count} bug(s) updated to ${status}`, "success");
  };

  const openCount = bugs.filter((b) => b.status === "Open").length;
  const inProgressCount = bugs.filter(
    (b) => b.status === "In Progress"
  ).length;
  const criticalCount = bugs.filter(
    (b) => b.severity === "Critical"
  ).length;
  const fixedCount = bugs.filter((b) => b.status === "Fixed").length;

  if (loading) {
    return (
      <>
        <div className="admin-head">
          <div>
            <h1>Bug Dashboard</h1>
            <p>Track, customize, and manage all reported bugs.</p>
          </div>
        </div>
        <Skeleton type="stat" />
        <Skeleton type="table" />
      </>
    );
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Bug Dashboard</h1>
          <p>Track, customize, and manage all reported bugs.</p>
        </div>
        <span className="count">{bugs.length} bugs</span>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-bug"></i>
          </div>
          <div className="stat-value">{bugs.length}</div>
          <div className="stat-label">Total Bugs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#1565c0" }}>
            <i className="fa-solid fa-circle-dot"></i>
          </div>
          <div className="stat-value">{openCount}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#9a7d0a" }}>
            <i className="fa-solid fa-spinner"></i>
          </div>
          <div className="stat-value">{inProgressCount}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#c0392b" }}>
            <i className="fa-solid fa-fire"></i>
          </div>
          <div className="stat-value">{criticalCount}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#2e7d32" }}>
            <i className="fa-solid fa-check-circle"></i>
          </div>
          <div className="stat-value">{fixedCount}</div>
          <div className="stat-label">Fixed</div>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search bugs by title, description, assignee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filters.status || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value || undefined }))
          }
        >
          <option value="">All Status</option>
          {BUG_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.severity || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              severity: e.target.value || undefined,
            }))
          }
        >
          <option value="">All Severity</option>
          {SEVERITIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.priority || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              priority: e.target.value || undefined,
            }))
          }
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select
          value={filters.bugType || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, bugType: e.target.value || undefined }))
          }
        >
          <option value="">All Types</option>
          {BUG_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="filter-bar">
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>
            {selected.size} selected
          </span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                bulkStatusChange(e.target.value as BugStatus);
              }
            }}
          >
            <option value="">Bulk change status...</option>
            {BUG_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {bugs.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-bug"></i>
          <h3>No bugs found</h3>
          <p>Create a feedback form to start collecting bugs.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={selected.size === bugs.length && bugs.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Priority</th>
                <th>Type</th>
                <th>Assignee</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((b) => (
                <tr key={b.formId}>
                  <td data-label="">
                    <input
                      type="checkbox"
                      checked={selected.has(b.formId)}
                      onChange={() => toggleSelect(b.formId)}
                    />
                  </td>
                  <td data-label="ID">
                    <code style={{ fontSize: "12px" }}>{b.formId}</code>
                  </td>
                  <td data-label="Title">
                    <strong
                      style={{ cursor: "pointer", color: "var(--primary)" }}
                      onClick={() => startEditing(b)}
                      title="Click to edit bug details"
                    >
                      {b.title}
                    </strong>
                    {b.tags.length > 0 && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--faint)",
                          marginTop: "2px",
                        }}
                      >
                        {b.tags.map((t) => `#${t}`).join(" ")}
                      </div>
                    )}
                  </td>
                  <td data-label="Status">
                    <select
                      value={b.status}
                      onChange={(e) =>
                        handleStatusChange(
                          b.formId,
                          e.target.value as BugStatus
                        )
                      }
                    >
                      {BUG_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Severity">
                    <span
                      className={`badge sev-${b.severity.toLowerCase()}`}
                    >
                      {b.severity}
                    </span>
                  </td>
                  <td data-label="Priority">
                    <span className={`badge badge-${b.priority.toLowerCase()}`}>
                      {b.priority}
                    </span>
                  </td>
                  <td data-label="Type">
                    <span className="badge badge-type">{b.bugType}</span>
                  </td>
                  <td data-label="Assignee" style={{ color: "var(--muted)" }}>{b.assignee}</td>
                  <td data-label="Updated" style={{ fontSize: "12px", color: "var(--faint)" }}>
                    {new Date(b.updatedAt).toLocaleDateString()}
                  </td>
                  <td data-label="Actions">
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn sm ghost"
                        onClick={() => startEditing(b)}
                        title="Edit Bug Title & Details"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        className="btn sm ghost linkish danger"
                        onClick={() => handleDelete(b.formId)}
                        title="Delete Bug"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Bug Modal */}
      {editingBug && (
        <div className="modal" onClick={() => setEditingBug(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-x"
              onClick={() => setEditingBug(null)}
            >
              ✕
            </button>
            <span className="eyebrow">{editingBug.formId}</span>
            <h2 style={{ marginBottom: "16px" }}>Edit Bug Details</h2>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label>
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Title *</span>
                <input
                  value={editingBug.title}
                  onChange={(e) =>
                    setEditingBug({ ...editingBug, title: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Description</span>
                <textarea
                  value={editingBug.description}
                  onChange={(e) =>
                    setEditingBug({ ...editingBug, description: e.target.value })
                  }
                  rows={3}
                />
              </label>

              <div className="two-col">
                <label>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>Bug Type</span>
                  <select
                    value={editingBug.bugType}
                    onChange={(e) =>
                      setEditingBug({
                        ...editingBug,
                        bugType: e.target.value as BugType,
                      })
                    }
                  >
                    {BUG_TYPES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>Severity</span>
                  <select
                    value={editingBug.severity}
                    onChange={(e) =>
                      setEditingBug({
                        ...editingBug,
                        severity: e.target.value as Severity,
                      })
                    }
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="two-col">
                <label>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>Priority</span>
                  <select
                    value={editingBug.priority}
                    onChange={(e) =>
                      setEditingBug({
                        ...editingBug,
                        priority: e.target.value as Priority,
                      })
                    }
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>Status</span>
                  <select
                    value={editingBug.status}
                    onChange={(e) =>
                      setEditingBug({
                        ...editingBug,
                        status: e.target.value as BugStatus,
                      })
                    }
                  >
                    {BUG_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="two-col">
                <label>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>Assignee / Team</span>
                  <input
                    value={editingBug.assignee}
                    onChange={(e) =>
                      setEditingBug({ ...editingBug, assignee: e.target.value })
                    }
                  />
                </label>

                <label>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>Environment</span>
                  <input
                    value={editingBug.environment || ""}
                    onChange={(e) =>
                      setEditingBug({ ...editingBug, environment: e.target.value })
                    }
                  />
                </label>
              </div>

              <label>
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Tags (comma separated)</span>
                <input
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setEditingBug(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
