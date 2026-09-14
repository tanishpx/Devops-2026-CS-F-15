import { useState, useEffect } from "react";
import { getStats, type Stats } from "../../lib/api";
import { useToast } from "../../components/Toast";
import Skeleton from "../../components/Skeleton";

interface BarData {
  label: string;
  value: number;
  fillClass?: string;
}

function BarChart({
  title,
  data,
  fillColor,
}: {
  title: string;
  data: BarData[];
  fillColor?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="bar-chart">
        {data.map((d) => (
          <div className="bar-row" key={d.label}>
            <span className="bar-label">{d.label}</span>
            <div className="bar-track">
              <div
                className={`bar-fill ${d.fillClass || "fill-status"}`}
                style={{
                  width: `${(d.value / max) * 100}%`,
                  background: !d.fillClass ? fillColor : undefined,
                }}
              />
            </div>
            <span className="bar-count">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => {
        console.error("Failed to load stats:", err);
        addToast("Failed to load analytics", "error");
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) {
    return (
      <>
        <div className="admin-head">
          <div>
            <h1>Analytics</h1>
            <p>Overview of your bug tracking metrics.</p>
          </div>
        </div>
        <Skeleton type="stat" />
        <Skeleton type="chart" />
      </>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-chart-bar"></i>
        <h3>No data available</h3>
        <p>Create some bugs and collect submissions to see analytics.</p>
      </div>
    );
  }

  const severityData: BarData[] = [
    { label: "Critical", value: stats.bugsBySeverity["Critical"] || 0, fillClass: "fill-sev-critical" },
    { label: "High", value: stats.bugsBySeverity["High"] || 0, fillClass: "fill-sev-high" },
    { label: "Medium", value: stats.bugsBySeverity["Medium"] || 0, fillClass: "fill-sev-medium" },
    { label: "Low", value: stats.bugsBySeverity["Low"] || 0, fillClass: "fill-sev-low" },
  ];

  const statusData: BarData[] = [
    { label: "Open", value: stats.bugsByStatus["Open"] || 0 },
    { label: "Triaged", value: stats.bugsByStatus["Triaged"] || 0 },
    { label: "Assigned", value: stats.bugsByStatus["Assigned"] || 0 },
    { label: "In Progress", value: stats.bugsByStatus["In Progress"] || 0 },
    { label: "Fixed", value: stats.bugsByStatus["Fixed"] || 0 },
    { label: "Retest", value: stats.bugsByStatus["Retest"] || 0 },
    { label: "Closed", value: stats.bugsByStatus["Closed"] || 0 },
    { label: "Reopened", value: stats.bugsByStatus["Reopened"] || 0 },
  ];

  const typeData: BarData[] = [
    { label: "UI", value: stats.bugsByType["UI"] || 0 },
    { label: "Runtime", value: stats.bugsByType["Runtime"] || 0 },
    { label: "Performance", value: stats.bugsByType["Performance"] || 0 },
    { label: "Security", value: stats.bugsByType["Security"] || 0 },
    { label: "API", value: stats.bugsByType["API"] || 0 },
    { label: "Other", value: stats.bugsByType["Other"] || 0 },
  ];

  const priorityData: BarData[] = [
    { label: "P0", value: stats.bugsByPriority["P0"] || 0, fillClass: "fill-p0" },
    { label: "P1", value: stats.bugsByPriority["P1"] || 0, fillClass: "fill-p1" },
    { label: "P2", value: stats.bugsByPriority["P2"] || 0, fillClass: "fill-p2" },
    { label: "P3", value: stats.bugsByPriority["P3"] || 0, fillClass: "fill-p3" },
  ];

  const submissionData: BarData[] = [
    { label: "New", value: stats.submissionsByStatus["New"] || 0 },
    { label: "Reviewed", value: stats.submissionsByStatus["Reviewed"] || 0 },
    { label: "Accepted", value: stats.submissionsByStatus["Accepted"] || 0 },
    { label: "Rejected", value: stats.submissionsByStatus["Rejected"] || 0 },
  ];

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Analytics</h1>
          <p>Overview of your bug tracking metrics.</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-bug"></i>
          </div>
          <div className="stat-value">{stats.overview.totalBugs}</div>
          <div className="stat-label">Total Bugs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#1565c0" }}>
            <i className="fa-solid fa-circle-dot"></i>
          </div>
          <div className="stat-value">{stats.overview.openBugs}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#9a7d0a" }}>
            <i className="fa-solid fa-spinner"></i>
          </div>
          <div className="stat-value">{stats.overview.inProgressBugs}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#c0392b" }}>
            <i className="fa-solid fa-fire"></i>
          </div>
          <div className="stat-value">{stats.overview.criticalBugs}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#1565c0" }}>
            <i className="fa-solid fa-inbox"></i>
          </div>
          <div className="stat-value">{stats.overview.totalSubmissions}</div>
          <div className="stat-label">Submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#2e7d32" }}>
            <i className="fa-solid fa-percent"></i>
          </div>
          <div className="stat-value">{stats.overview.acceptanceRate}%</div>
          <div className="stat-label">Acceptance Rate</div>
        </div>
      </div>

      <div className="chart-grid">
        <BarChart title="Bugs by Severity" data={severityData} />
        <BarChart title="Bugs by Status" data={statusData} />
        <BarChart title="Bugs by Type" data={typeData} />
        <BarChart title="Bugs by Priority" data={priorityData} />
        <BarChart title="Submissions by Status" data={submissionData} />
      </div>
    </>
  );
}
