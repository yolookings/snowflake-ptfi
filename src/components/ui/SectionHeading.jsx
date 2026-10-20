export function SectionHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="section-heading__eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="section-heading__action">{action}</div>}
    </div>
  );
}
