export function PageHeader({ kicker, title, subtitle, actions, meta }) {
  return (
    <div className="page-header">
      <div className="page-header__copy">
        <div className="page-kicker">{kicker}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="page-header__side">
        {meta && <div className="page-header__meta">{meta}</div>}
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </div>
  );
}
