import { useState, useEffect, useCallback } from "react";
import {
  getBugs,
  createBug,
  deleteBug,
  updateBug,
  type Bug,
  type CreateBugPayload,
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

const emptyForm: CreateBugPayload = {
  title: "",
  description: "",
  bugType: "UI",
  severity: "Medium",
  priority: "P2",
  assignee: "",
  reporter: "",
  environment: "",
  tags: [],
};

type Tab = "create" | "forms";

export default function FeedbackForms() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [draft, setDraft] = useState<CreateBugPayload>(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [editTagInput, setEditTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("forms");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadBugs = useCallback(async () => {
    try {
      const data = await getBugs();
      setBugs(data);
    } catch (err) {
      console.error("Failed to load bugs:", err);
      addToast("Failed to load forms", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadBugs();
  }, [loadBugs]);

  const addBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const newBug = await createBug({
        ...draft,
        title: draft.title.trim(),
        description: draft.description?.trim() || "",
        assignee: draft.assignee?.trim() || "Unassigned",
        tags: tagInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setBugs((prev) => [newBug, ...prev]);
      setDraft(emptyForm);
      setTagInput("");
      setTab("forms");
      addToast("Form created successfully", "success");
    } catch (err) {
      console.error("Failed to create bug:", err);
      addToast("Failed to create form", "error");
    } finally {
      setSubmitting(false);
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
      addToast("Form updated successfully", "success");
    } catch (err) {
      console.error("Failed to update bug form:", err);
      addToast("Failed to update form", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const removeBug = async (formId: string) => {
    try {
      await deleteBug(formId);
      setBugs((prev) => prev.filter((b) => b.formId !== formId));
      setConfirmDelete(null);
      addToast("Form deleted", "success");
    } catch (err) {
      console.error("Failed to delete bug:", err);
      addToast("Failed to delete form", "error");
    }
  };

  const copyLink = (formId: string) => {
    const url = `${window.location.origin}/#/feedback/${formId}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(formId);
    addToast("Link copied to clipboard", "success");
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const update = <K extends keyof CreateBugPayload>(
    key: K,
    value: CreateBugPayload[K]
  ) => setDraft((d) => ({ ...d, [key]: value }));

  if (loading) {
    return <Skeleton type="form" />;
  }

  return (
    <div className="fb">
      {/* Page Header */}
      <div className="fb-header">
        <div className="fb-header-left">
          <h1 className="fb-title">Feedback Forms</h1>
          <p className="fb-subtitle">Create forms to collect bug reports from your users</p>
        </div>
        <div className="fb-tabs">
          <button
            className={`fb-tab ${tab === "forms" ? "active" : ""}`}
            onClick={() => setTab("forms")}
          >
            <i className="fa-solid fa-layer-group" />
            My Forms
            {bugs.length > 0 && <span className="fb-tab-count">{bugs.length}</span>}
          </button>
          <button
            className={`fb-tab ${tab === "create" ? "active" : ""}`}
            onClick={() => setTab("create")}
          >
            <i className="fa-solid fa-plus" />
            Create New
          </button>
        </div>
      </div>

      {/* Create Form Tab */}
      {tab === "create" && (
        <form className="fb-create" onSubmit={addBug}>
          <div className="fb-create-body">
            <div className="fb-section">
              <div className="fb-section-head">
                <i className="fa-solid fa-pen-to-square" />
                <span>Form Details</span>
              </div>
              <div className="fb-field">
                <label className="fb-label">Title *</label>
                <input
                  className="fb-input"
                  value={draft.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Checkout bug report"
                  required
                  autoFocus
                />
              </div>
              <div className="fb-field">
                <label className="fb-label">Description</label>
                <textarea
                  className="fb-input fb-textarea"
                  value={draft.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="What details should users provide when submitting?"
                  rows={3}
                />
              </div>
            </div>

            <div className="fb-section">
              <div className="fb-section-head">
                <i className="fa-solid fa-sliders" />
                <span>Configuration</span>
              </div>
              <div className="fb-grid-2">
                <div className="fb-field">
                  <label className="fb-label">Bug Type</label>
                  <select
                    className="fb-input fb-select"
                    value={draft.bugType}
                    onChange={(e) => update("bugType", e.target.value as BugType)}
                  >
                    {BUG_TYPES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="fb-field">
                  <label className="fb-label">Severity</label>
                  <select
                    className="fb-input fb-select"
                    value={draft.severity}
                    onChange={(e) => update("severity", e.target.value as Severity)}
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="fb-field">
                  <label className="fb-label">Priority</label>
                  <select
                    className="fb-input fb-select"
                    value={draft.priority}
                    onChange={(e) => update("priority", e.target.value as Priority)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="fb-field">
                  <label className="fb-label">Environment</label>
                  <input
                    className="fb-input"
                    value={draft.environment}
                    onChange={(e) => update("environment", e.target.value)}
                    placeholder="e.g. Production"
                  />
                </div>
              </div>
            </div>

            <div className="fb-section">
              <div className="fb-section-head">
                <i className="fa-solid fa-users" />
                <span>Assignment</span>
              </div>
              <div className="fb-grid-2">
                <div className="fb-field">
                  <label className="fb-label">Assignee</label>
                  <input
                    className="fb-input"
                    value={draft.assignee}
                    onChange={(e) => update("assignee", e.target.value)}
                    placeholder="e.g. Frontend Team"
                  />
                </div>
                <div className="fb-field">
                  <label className="fb-label">Tags</label>
                  <input
                    className="fb-input"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="ui, payment, checkout"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="fb-create-footer">
            <button
              type="button"
              className="fb-btn fb-btn-ghost"
              onClick={() => { setDraft(emptyForm); setTagInput(""); setTab("forms"); }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="fb-btn fb-btn-primary"
              disabled={submitting || !draft.title.trim()}
            >
              {submitting ? (
                <><i className="fa-solid fa-circle-notch fa-spin" /> Creating...</>
              ) : (
                <><i className="fa-solid fa-plus" /> Create Form</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Forms List Tab */}
      {tab === "forms" && (
        <div className="fb-list">
          {bugs.length === 0 ? (
            <div className="fb-empty">
              <div className="fb-empty-icon">
                <i className="fa-solid fa-file-circle-plus" />
              </div>
              <h3>No forms yet</h3>
              <p>Create your first feedback form to start collecting bug reports.</p>
              <button className="fb-btn fb-btn-primary" onClick={() => setTab("create")}>
                <i className="fa-solid fa-plus" /> Create Form
              </button>
            </div>
          ) : (
            <div className="fb-cards">
              {bugs.map((b) => (
                <div className="fb-card" key={b.formId}>
                  <div className="fb-card-header">
                    <div className="fb-card-title-group">
                      <h3 className="fb-card-title">{b.title}</h3>
                      <span className={`fb-card-status fb-status-${b.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="fb-card-actions">
                      <button
                        className="fb-icon-btn"
                        onClick={() => copyLink(b.formId)}
                        title="Copy link"
                      >
                        <i className={copySuccess === b.formId ? "fa-solid fa-check" : "fa-solid fa-link"} />
                      </button>
                      <a
                        href={`/#/feedback/${b.formId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="fb-icon-btn"
                        title="Open form"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square" />
                      </a>
                      <button
                        className="fb-icon-btn"
                        onClick={() => startEditing(b)}
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        className="fb-icon-btn fb-icon-btn-danger"
                        onClick={() => setConfirmDelete(b.formId)}
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>

                  {b.description && (
                    <p className="fb-card-desc">{b.description}</p>
                  )}

                  <div className="fb-card-meta">
                    <span className={`fb-badge fb-sev-${b.severity.toLowerCase()}`}>{b.severity}</span>
                    <span className="fb-badge fb-badge-type">{b.bugType}</span>
                    <span className="fb-badge fb-badge-priority">{b.priority}</span>
                    {b.assignee && b.assignee !== "Unassigned" && (
                      <span className="fb-badge fb-badge-assignee">
                        <i className="fa-solid fa-user" /> {b.assignee}
                      </span>
                    )}
                  </div>

                  {b.tags && b.tags.length > 0 && (
                    <div className="fb-card-tags">
                      {b.tags.map((t) => (
                        <span key={t} className="fb-tag">#{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Delete Confirmation */}
                  {confirmDelete === b.formId && (
                    <div className="fb-delete-confirm">
                      <span>Delete this form?</span>
                      <div className="fb-delete-actions">
                        <button className="fb-btn fb-btn-sm fb-btn-ghost" onClick={() => setConfirmDelete(null)}>
                          Cancel
                        </button>
                        <button className="fb-btn fb-btn-sm fb-btn-danger" onClick={() => removeBug(b.formId)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingBug && (
        <div className="modal" onClick={() => setEditingBug(null)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setEditingBug(null)}>✕</button>
            <span className="eyebrow">{editingBug.formId}</span>
            <h2 style={{ marginBottom: 16 }}>Edit Form</h2>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="fb-field">
                <label className="fb-label">Title *</label>
                <input
                  className="fb-input"
                  value={editingBug.title}
                  onChange={(e) => setEditingBug({ ...editingBug, title: e.target.value })}
                  required
                />
              </div>
              <div className="fb-field">
                <label className="fb-label">Description</label>
                <textarea
                  className="fb-input fb-textarea"
                  value={editingBug.description}
                  onChange={(e) => setEditingBug({ ...editingBug, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="fb-grid-2">
                <div className="fb-field">
                  <label className="fb-label">Bug Type</label>
                  <select className="fb-input fb-select" value={editingBug.bugType} onChange={(e) => setEditingBug({ ...editingBug, bugType: e.target.value as BugType })}>
                    {BUG_TYPES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="fb-field">
                  <label className="fb-label">Severity</label>
                  <select className="fb-input fb-select" value={editingBug.severity} onChange={(e) => setEditingBug({ ...editingBug, severity: e.target.value as Severity })}>
                    {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="fb-field">
                  <label className="fb-label">Priority</label>
                  <select className="fb-input fb-select" value={editingBug.priority} onChange={(e) => setEditingBug({ ...editingBug, priority: e.target.value as Priority })}>
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="fb-field">
                  <label className="fb-label">Status</label>
                  <select className="fb-input fb-select" value={editingBug.status} onChange={(e) => setEditingBug({ ...editingBug, status: e.target.value as BugStatus })}>
                    {BUG_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="fb-grid-2">
                <div className="fb-field">
                  <label className="fb-label">Assignee</label>
                  <input className="fb-input" value={editingBug.assignee} onChange={(e) => setEditingBug({ ...editingBug, assignee: e.target.value })} />
                </div>
                <div className="fb-field">
                  <label className="fb-label">Environment</label>
                  <input className="fb-input" value={editingBug.environment || ""} onChange={(e) => setEditingBug({ ...editingBug, environment: e.target.value })} />
                </div>
              </div>
              <div className="fb-field">
                <label className="fb-label">Tags</label>
                <input className="fb-input" value={editTagInput} onChange={(e) => setEditTagInput(e.target.value)} placeholder="tag1, tag2" />
              </div>
              <div className="modal-actions">
                <button type="button" className="fb-btn fb-btn-ghost" onClick={() => setEditingBug(null)}>Cancel</button>
                <button type="submit" className="fb-btn fb-btn-primary" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
