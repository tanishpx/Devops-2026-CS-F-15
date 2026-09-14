import { useState, useEffect } from "react";
import { getStats, type Stats } from "../../lib/api";
import { useToast } from "../../components/Toast";
import Skeleton from "../../components/Skeleton";

function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="ig-metric">
      <span className="ig-metric-value">{value}</span>
      <span className="ig-metric-label">{label}</span>
      {sub && <span className="ig-metric-sub">{sub}</span>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ig-section">
      <h3 className="ig-section-title">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="ig-row">
      <div className="ig-row-header">
        <span className="ig-row-label">{label}</span>
        <span className="ig-row-value">{value}</span>
      </div>
      <div className="ig-row-bar">
        <div className="ig-row-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Insights() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => {
        console.error("Failed to load stats:", err);
        addToast("Failed to load insights", "error");
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) {
    return (
      <div className="ig">
        <div className="ig-header">
          <h1 className="ig-title">Insights</h1>
          <p className="ig-sub">Resolution metrics at a glance</p>
        </div>
        <Skeleton type="stat" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="ig">
        <div className="ig-header">
          <h1 className="ig-title">Insights</h1>
          <p className="ig-sub">Resolution metrics at a glance</p>
        </div>
        <div className="ig-empty">
          <h3>No data yet</h3>
          <p>Create bugs and collect submissions to see insights.</p>
        </div>
      </div>
    );
  }

  const { overview } = stats;
  const totalBugs = overview.totalBugs || 1;

  const statusRows = Object.entries(stats.bugsByStatus)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const severityRows = Object.entries(stats.bugsBySeverity)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const typeRows = Object.entries(stats.bugsByType)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const priorityRows = Object.entries(stats.bugsByPriority)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const submissionRows = Object.entries(stats.submissionsByStatus)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="ig">
      <div className="ig-header">
        <h1 className="ig-title">Insights</h1>
        <p className="ig-sub">Resolution metrics at a glance</p>
      </div>

      {/* Key Metrics */}
      <div className="ig-metrics">
        <Metric label="Total Bugs" value={overview.totalBugs} />
        <Metric label="Open" value={overview.openBugs} sub={`${Math.round((overview.openBugs / totalBugs) * 100)}%`} />
        <Metric label="In Progress" value={overview.inProgressBugs} />
        <Metric label="Critical" value={overview.criticalBugs} />
        <Metric label="Submissions" value={overview.totalSubmissions} />
        <Metric label="Acceptance" value={`${overview.acceptanceRate}%`} />
      </div>

      {/* Breakdown Sections */}
      <div className="ig-grid">
        {statusRows.length > 0 && (
          <Section title="By Status">
            {statusRows.map(([label, value]) => (
              <Row key={label} label={label} value={value} total={totalBugs} />
            ))}
          </Section>
        )}

        {severityRows.length > 0 && (
          <Section title="By Severity">
            {severityRows.map(([label, value]) => (
              <Row key={label} label={label} value={value} total={totalBugs} />
            ))}
          </Section>
        )}

        {typeRows.length > 0 && (
          <Section title="By Type">
            {typeRows.map(([label, value]) => (
              <Row key={label} label={label} value={value} total={totalBugs} />
            ))}
          </Section>
        )}

        {priorityRows.length > 0 && (
          <Section title="By Priority">
            {priorityRows.map(([label, value]) => (
              <Row key={label} label={label} value={value} total={totalBugs} />
            ))}
          </Section>
        )}

        {submissionRows.length > 0 && (
          <Section title="Submissions">
            {submissionRows.map(([label, value]) => (
              <Row key={label} label={label} value={value} total={overview.totalSubmissions} />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
