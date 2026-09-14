import { useState, useEffect, useCallback } from "react";
import {
  getSubmissions,
  updateSubmission,
  type Submission,
} from "../../lib/api";
import { useToast } from "../../components/Toast";
import Skeleton from "../../components/Skeleton";

type FilterStatus = "" | "New" | "Reviewed" | "Accepted" | "Rejected";

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "New", label: "New" },
  { value: "Reviewed", label: "Reviewed" },
  { value: "Accepted", label: "Accepted" },
  { value: "Rejected", label: "Rejected" },
];

function getCompleteness(s: Submission): { score: number; missing: string[] } {
  const missing: string[] = [];
  if (!s.bugTitle && !s.formTitle) missing.push("Title");
  if (!s.bugDescription) missing.push("Description");
  if (!s.stepsToReproduce) missing.push("Steps to reproduce");
  if (!s.environment) missing.push("Environment");
  if (!s.bugType) missing.push("Bug type");
  if (!s.severity) missing.push("Severity");
  if (!s.attachments || s.attachments.length === 0) missing.push("Attachments");
  const total = 7;
  const score = Math.round(((total - missing.length) / total) * 100);
  return { score, missing };
}

export default function Inbox() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadSubmissions = useCallback(async () => {
    try {
      const data = await getSubmissions(filter || undefined);
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      addToast("Failed to load submissions", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, addToast]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleTriage = async (id: string, status: string) => {
    try {
      const updated = await updateSubmission(id, status);
      setSubmissions((prev) => prev.map((s) => (s._id === id ? updated : s)));
      addToast(`Marked as ${status}`, "success");
    } catch (err) {
      console.error("Failed to update submission:", err);
      addToast("Failed to update", "error");
    }
  };

  const counts = {
    "": submissions.length,
    New: submissions.filter((s) => s.status === "New").length,
    Reviewed: submissions.filter((s) => s.status === "Reviewed").length,
    Accepted: submissions.filter((s) => s.status === "Accepted").length,
    Rejected: submissions.filter((s) => s.status === "Rejected").length,
  };

  if (loading) {
    return (
      <div className="ib">
        <div className="ib-header">
          <div>
            <h1 className="ib-title">Inbox</h1>
            <p className="ib-sub">Incoming bug reports waiting for review</p>
          </div>
        </div>
        <Skeleton type="card" />
      </div>
    );
  }

  return (
    <div className="ib">
      <div className="ib-header">
        <div>
          <h1 className="ib-title">Inbox</h1>
          <p className="ib-sub">Incoming bug reports — review and enrich for AI</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="ib-filters">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`ib-filter ${filter === f.value ? "active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span className="ib-filter-count">{counts[f.value]}</span>
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="ib-empty">
          <div className="ib-empty-icon">
            <i className="fa-solid fa-inbox" />
          </div>
          <h3>No submissions yet</h3>
          <p>Share a form link to start collecting bug reports.</p>
        </div>
      ) : (
        <div className="ib-list">
          {submissions.map((s) => {
            const { score, missing } = getCompleteness(s);
            const isExpanded = expanded === s._id;

            return (
              <div className={`ib-card ${isExpanded ? "expanded" : ""}`} key={s._id}>
                {/* Card Header */}
                <div className="ib-card-header">
                  <div className="ib-card-title-row">
                    <h3 className="ib-card-title">
                      {s.bugTitle || s.formTitle || "Untitled"}
                    </h3>
                    <div className="ib-card-badges">
                      {s.severity && (
                        <span className={`ib-badge ib-sev-${s.severity.toLowerCase()}`}>
                          {s.severity}
                        </span>
                      )}
                      {s.bugType && (
                        <span className="ib-badge ib-type">{s.bugType}</span>
                      )}
                      <span className={`ib-badge ib-status-${s.status.toLowerCase()}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                  <div className="ib-card-meta">
                    <span className="ib-time">
                      {new Date(s.createdAt).toLocaleString()}
                    </span>
                    {s.formTitle && s.bugTitle && (
                      <span className="ib-via">via {s.formTitle}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="ib-card-desc">
                  {s.bugDescription || "No description provided."}
                </p>

                {/* AI Readiness Score */}
                {s.status !== "Accepted" && s.status !== "Rejected" && (
                  <div className="ib-readiness">
                    <div className="ib-readiness-header">
                      <span className="ib-readiness-label">AI Readiness</span>
                      <span className="ib-readiness-score">{score}%</span>
                    </div>
                    <div className="ib-readiness-bar">
                      <div
                        className="ib-readiness-fill"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    {missing.length > 0 && (
                      <div className="ib-missing">
                        Missing: {missing.join(", ")}
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="ib-details">
                    {s.stepsToReproduce && (
                      <div className="ib-detail">
                        <span className="ib-detail-label">Steps to Reproduce</span>
                        <div className="ib-detail-value ib-steps">
                          {s.stepsToReproduce}
                        </div>
                      </div>
                    )}
                    {s.environment && (
                      <div className="ib-detail">
                        <span className="ib-detail-label">Environment</span>
                        <span className="ib-detail-value">{s.environment}</span>
                      </div>
                    )}
                    {s.reporterEmail && (
                      <div className="ib-detail">
                        <span className="ib-detail-label">Reporter</span>
                        <span className="ib-detail-value">{s.reporterEmail}</span>
                      </div>
                    )}
                    {s.attachments && s.attachments.length > 0 && (
                      <div className="ib-detail">
                        <span className="ib-detail-label">
                          Attachments ({s.attachments.length})
                        </span>
                        <div className="ib-attachments">
                          {s.attachments.map((att, idx) =>
                            att.startsWith("data:image/") ? (
                              <a key={idx} href={att} target="_blank" rel="noreferrer" className="ib-attachment-img">
                                <img src={att} alt={`Attachment ${idx + 1}`} />
                              </a>
                            ) : (
                              <a key={idx} href={att} download className="ib-attachment-file">
                                <i className="fa-solid fa-paperclip" /> Attachment {idx + 1}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="ib-card-actions">
                  <button
                    className="ib-action"
                    onClick={() => setExpanded(isExpanded ? null : s._id)}
                  >
                    <i className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"}`} />
                    {isExpanded ? "Less" : "Details"}
                  </button>
                  {(s.status === "New" || s.status === "Reviewed") && (
                    <>
                      <button
                        className="ib-action ib-action-primary"
                        onClick={() => handleTriage(s._id, "Accepted")}
                      >
                        <i className="fa-solid fa-check" /> Accept
                      </button>
                      <button
                        className="ib-action ib-action-danger"
                        onClick={() => handleTriage(s._id, "Rejected")}
                      >
                        <i className="fa-solid fa-xmark" /> Reject
                      </button>
                      {s.status === "New" && (
                        <button
                          className="ib-action"
                          onClick={() => handleTriage(s._id, "Reviewed")}
                        >
                          <i className="fa-solid fa-eye" /> Reviewed
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
