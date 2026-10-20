import { Icon } from "./Icon";

const TONE_ICONS = {
  success: "circle-check",
  warning: "triangle-exclamation",
  danger: "circle-exclamation",
  info: "circle-info",
  neutral: "circle-dot",
};

export function Badge({ children, tone = "neutral", dot = false, icon }) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {dot ? <span className="status-badge__dot" /> : <Icon name={icon || TONE_ICONS[tone]} />}
      {children}
    </span>
  );
}
