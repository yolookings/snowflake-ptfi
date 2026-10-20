import { Icon } from "./Icon";

export function MetricCard({
  label,
  value,
  delta,
  deltaTone = "positive",
  note,
  icon,
  tone = "cyan",
}) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__topline">
        <span className="metric-card__label">{label}</span>
        <span className="metric-card__icon">
          <Icon name={icon} />
        </span>
      </div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__bottomline">
        {delta && (
          <span className={`metric-card__delta metric-card__delta--${deltaTone}`}>{delta}</span>
        )}
        {note && <span className="metric-card__note">{note}</span>}
      </div>
    </article>
  );
}
