export function ProgressBar({ value, tone = "cyan", label, showValue = true }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="progress-bar-wrap">
      {(label || showValue) && (
        <div className="progress-bar__meta">
          {label && <span>{label}</span>}
          {showValue && <strong>{safeValue.toFixed(0)}%</strong>}
        </div>
      )}
      <div
        className="progress-track"
        aria-label={label}
        role="progressbar"
        aria-valuenow={safeValue}
      >
        <span
          className={`progress-fill progress-fill--${tone}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
