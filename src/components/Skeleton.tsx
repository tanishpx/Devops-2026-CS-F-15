import "./Skeleton.css";

interface SkeletonProps {
  lines?: number;
  type?: "text" | "card" | "stat" | "table" | "chart" | "form";
  className?: string;
}

export default function Skeleton({ lines = 3, type = "text", className = "" }: SkeletonProps) {
  if (type === "stat") {
    return (
      <div className={`skeleton-container ${className}`}>
        <div className="skeleton-stats-row">
          {[1, 2, 3, 4].map((i) => (
            <div className="skeleton-stat-card" key={i}>
              <div className="skeleton-icon" />
              <div className="skeleton-line skeleton-value" />
              <div className="skeleton-line skeleton-label" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={`skeleton-container ${className}`}>
        <div className="skeleton-table">
          <div className="skeleton-table-header">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="skeleton-cell skeleton-th" key={i} />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((row) => (
            <div className="skeleton-table-row" key={row}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div className="skeleton-cell" key={i}>
                  <div className="skeleton-line" style={{ width: `${60 + Math.random() * 40}%` }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className={`skeleton-container ${className}`}>
        <div className="skeleton-charts-grid">
          {[1, 2, 3].map((i) => (
            <div className="skeleton-chart-card" key={i}>
              <div className="skeleton-line skeleton-chart-title" />
              <div className="skeleton-bars">
                {[1, 2, 3, 4].map((j) => (
                  <div className="skeleton-bar-row" key={j}>
                    <div className="skeleton-bar-label" />
                    <div className="skeleton-bar-track">
                      <div className="skeleton-bar-fill" style={{ width: `${30 + Math.random() * 70}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className={`skeleton-container ${className}`}>
        <div className="skeleton-cards">
          {[1, 2, 3].map((i) => (
            <div className="skeleton-card" key={i}>
              <div className="skeleton-line skeleton-card-title" />
              <div className="skeleton-line skeleton-card-text" />
              <div className="skeleton-line skeleton-card-text short" />
              <div className="skeleton-row">
                <div className="skeleton-badge" />
                <div className="skeleton-badge" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "form") {
    return (
      <div className={`skeleton-container ${className}`}>
        <div className="skeleton-form-layout">
          <div className="skeleton-form-builder">
            <div className="skeleton-line skeleton-form-title" />
            {[1, 2, 3, 4].map((i) => (
              <div className="skeleton-form-field" key={i}>
                <div className="skeleton-line skeleton-field-label" />
                <div className="skeleton-input" />
              </div>
            ))}
            <div className="skeleton-btn" />
          </div>
          <div className="skeleton-form-list">
            <div className="skeleton-line skeleton-form-title" />
            {[1, 2].map((i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-line skeleton-card-title" />
                <div className="skeleton-line skeleton-card-text" />
                <div className="skeleton-row">
                  <div className="skeleton-badge" />
                  <div className="skeleton-badge" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`skeleton-container ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          className="skeleton-line"
          key={i}
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
