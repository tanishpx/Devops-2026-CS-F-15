import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicForm, submitFeedback, type PublicForm } from "../lib/api";
import { BUG_TYPES, SEVERITIES, type BugType, type Severity } from "../lib/forms";

type FormState = "loading" | "form" | "success" | "not-found";

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export default function FeedbackFormPage() {
  const { formId } = useParams<{ formId: string }>();
  const [state, setState] = useState<FormState>("loading");
  const [form, setForm] = useState<PublicForm | null>(null);

  const [bugTitle, setBugTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [bugType, setBugType] = useState<BugType>("UI");
  const [bugDescription, setBugDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [environment, setEnvironment] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [submittedTitle, setSubmittedTitle] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!formId) return;
    getPublicForm(formId)
      .then((data) => {
        setForm(data);
        if (data.severity && SEVERITIES.includes(data.severity as Severity)) {
          setSeverity(data.severity as Severity);
        }
        if (data.bugType && BUG_TYPES.includes(data.bugType as BugType)) {
          setBugType(data.bugType as BugType);
        }
        if (data.environment) {
          setEnvironment(data.environment);
        }
        setState("form");
      })
      .catch(() => setState("not-found"));
  }, [formId]);

  const handleAutoDetectSystem = () => {
    const ua = navigator.userAgent;
    let browser = "Browser";
    let os = "OS";

    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("like Mac")) os = "iOS";

    if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
    else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
    else if (ua.includes("Firefox/")) browser = "Firefox";

    setEnvironment(`${browser} on ${os} (${window.screen.width}x${window.screen.height})`);
  };

  const handleInsertStepsTemplate = () => {
    const template = `1. Navigate to: \n2. Action performed: \n3. Observed bug: \n4. Expected outcome: `;
    setStepsToReproduce((prev) => (prev.trim() ? prev + "\n\n" + template : template));
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (attachments.length >= 5) {
        setErrorMsg("Maximum of 5 attachments allowed.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds 10MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, size: file.size, type: file.type, dataUrl: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId || submitting) return;

    if (!bugTitle.trim()) {
      setErrorMsg("Please enter a title for the bug.");
      return;
    }
    if (!bugDescription.trim()) {
      setErrorMsg("Please provide a description of the bug.");
      return;
    }
    if (!stepsToReproduce.trim()) {
      setErrorMsg("Please provide steps to reproduce the issue.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await submitFeedback(formId, {
        title: bugTitle.trim(),
        bugTitle: bugTitle.trim(),
        severity,
        bugType,
        bugDescription: bugDescription.trim(),
        stepsToReproduce: stepsToReproduce.trim(),
        environment: environment.trim(),
        reporterEmail: reporterEmail.trim(),
        attachments: attachments.map((a) => a.dataUrl || a.name),
      });
      setSubmissionId(res.id || `SUB-${Date.now().toString().slice(-6)}`);
      setSubmittedTitle(bugTitle.trim());
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setBugTitle("");
    setBugDescription("");
    setStepsToReproduce("");
    setEnvironment(form?.environment || "");
    setReporterEmail("");
    setAttachments([]);
    setErrorMsg("");
    setState("form");
  };

  if (state === "loading") {
    return (
      <div className="fp-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (state === "not-found") {
    return (
      <div className="fp-page">
        <div className="fp-card fp-card-center">
          <div className="fp-empty-icon">
            <i className="fa-solid fa-magnifying-glass" />
          </div>
          <h1>Form not found</h1>
          <p>This feedback form doesn't exist or is no longer active.</p>
          <Link to="/" className="fp-btn fp-btn-primary">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="fp-page">
        <div className="fp-card fp-card-center">
          <div className="fp-success-icon">
            <i className="fa-solid fa-check" />
          </div>
          <h1>Submitted</h1>
          <p>Thank you for reporting this issue. We'll investigate it shortly.</p>

          <div className="fp-receipt">
            <div className="fp-receipt-row">
              <span className="fp-receipt-label">ID</span>
              <code className="fp-receipt-value">#{submissionId}</code>
              <button
                type="button"
                className="fp-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(submissionId);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {submittedTitle && (
              <div className="fp-receipt-row">
                <span className="fp-receipt-label">Issue</span>
                <span className="fp-receipt-value">{submittedTitle}</span>
              </div>
            )}
            <div className="fp-receipt-row">
              <span className="fp-receipt-label">Severity</span>
              <span className={`badge sev-${severity.toLowerCase()}`}>{severity}</span>
            </div>
            <div className="fp-receipt-row">
              <span className="fp-receipt-label">Type</span>
              <span className="badge badge-type">{bugType}</span>
            </div>
            <div className="fp-receipt-row">
              <span className="fp-receipt-label">Status</span>
              <span className="badge status-open">New</span>
            </div>
          </div>

          <div className="fp-actions">
            <button type="button" className="fp-btn fp-btn-outline" onClick={handleResetForm}>
              <i className="fa-solid fa-plus" /> Submit another
            </button>
            <Link to="/" className="fp-btn fp-btn-primary">
              <i className="fa-solid fa-house" /> Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fp-page">
      <div className="fp-card">
        <div className="fp-header">
          <div className="fp-header-top">
            <span className="fp-badge">
              <i className="fa-solid fa-bug" />
              {form?.bugType ? `${form.bugType} Report` : "Bug Report"}
            </span>
            {form?.formId && <span className="fp-id-tag">{form.formId}</span>}
          </div>
          <h1>{form?.title || "Submit a bug report"}</h1>
          <p>{form?.description || "Help us squash bugs by providing clear and detailed information."}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fp-grid">
            <div className="fp-field fp-full">
              <label className="fp-label">
                <span>Title *</span>
                <span className="fp-counter">{bugTitle.length}/120</span>
              </label>
              <input
                type="text"
                className="fp-input"
                value={bugTitle}
                maxLength={120}
                onChange={(e) => setBugTitle(e.target.value)}
                placeholder="e.g. Payment button unresponsive on iOS"
                required
              />
            </div>

            <div className="fp-field">
              <label className="fp-label">Severity *</label>
              <div className="fp-severity">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`fp-sev-btn sev-${s.toLowerCase()} ${severity === s ? "active" : ""}`}
                    onClick={() => setSeverity(s)}
                  >
                    <span className="fp-sev-dot" />
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="fp-field">
              <label className="fp-label">Category *</label>
              <select
                className="fp-select"
                value={bugType}
                onChange={(e) => setBugType(e.target.value as BugType)}
              >
                {BUG_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="fp-field fp-full">
              <label className="fp-label">
                <span>Description *</span>
                <span className="fp-counter">{bugDescription.length}/1000</span>
              </label>
              <textarea
                className="fp-textarea"
                rows={4}
                maxLength={1000}
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                placeholder="What happened? What did you expect instead?"
                required
              />
            </div>

            <div className="fp-field fp-full">
              <div className="fp-label-row">
                <label className="fp-label">Steps to reproduce *</label>
                <button type="button" className="fp-link-btn" onClick={handleInsertStepsTemplate}>
                  <i className="fa-solid fa-list-ol" /> Template
                </button>
              </div>
              <textarea
                className="fp-textarea"
                rows={3}
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. Go to page...&#10;2. Click button...&#10;3. See error..."
                required
              />
            </div>

            <div className="fp-field">
              <div className="fp-label-row">
                <label className="fp-label">Environment</label>
                <button type="button" className="fp-link-btn" onClick={handleAutoDetectSystem}>
                  <i className="fa-solid fa-wand-magic-sparkles" /> Detect
                </button>
              </div>
              <input
                type="text"
                className="fp-input"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="e.g. Chrome on Windows"
              />
            </div>

            <div className="fp-field">
              <label className="fp-label">Email (optional)</label>
              <input
                type="email"
                className="fp-input"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="fp-field fp-full">
              <label className="fp-label">
                <span>Attachments</span>
                <span className="fp-counter">{attachments.length}/5</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*,video/*,.pdf,.txt,.log,.json"
                style={{ display: "none" }}
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  if (e.target) e.target.value = "";
                }}
              />
              <div
                className={`fp-upload ${isDragging ? "dragging" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
              >
                <i className="fa-solid fa-cloud-arrow-up" />
                <span>Drop files or <strong>browse</strong></span>
                <small>PNG, JPG, PDF, LOG up to 10MB</small>
              </div>

              {attachments.length > 0 && (
                <div className="fp-files">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="fp-file-chip">
                      {file.type.startsWith("image/") && file.dataUrl ? (
                        <img src={file.dataUrl} alt={file.name} className="fp-file-thumb" />
                      ) : (
                        <i className="fa-solid fa-file-lines" />
                      )}
                      <div className="fp-file-info">
                        <span className="fp-file-name">{file.name}</span>
                        <span className="fp-file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        className="fp-file-remove"
                        onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(idx); }}
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="fp-error">
              <i className="fa-solid fa-circle-exclamation" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="fp-actions">
            <Link to="/" className="fp-btn fp-btn-outline">Cancel</Link>
            <button className="fp-btn fp-btn-primary" type="submit" disabled={submitting}>
              {submitting ? (
                <><i className="fa-solid fa-circle-notch fa-spin" /> Submitting...</>
              ) : (
                <><i className="fa-solid fa-paper-plane" /> Submit Report</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
