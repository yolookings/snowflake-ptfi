export function Panel({
  title,
  eyebrow,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "",
}) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || eyebrow || subtitle || actions) && (
        <header className="panel__header">
          <div>
            {eyebrow && <div className="panel__eyebrow">{eyebrow}</div>}
            {title && <h2 className="panel__title">{title}</h2>}
            {subtitle && <p className="panel__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="panel__actions">{actions}</div>}
        </header>
      )}
      <div className={`panel__body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}
