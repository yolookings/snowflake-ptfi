import { NAVIGATION } from "../../data/navigation";
import { Icon } from "../ui/Icon";

export function MobileSidebar({ open, activeModule, onClose, onNavigate }) {
  return (
    <>
      <div
        className={`mobile-sidebar-overlay ${open ? "is-visible" : ""}`}
        onClick={onClose}
      />
      <aside
        className={`mobile-sidebar ${open ? "is-open" : ""}`}
        aria-hidden={!open}
      >
        <div className="mobile-sidebar__header">
          <img
            src="/brand/ptfi-logo.svg"
            alt="PT Freeport Indonesia"
          />
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <Icon name="xmark" />
          </button>
        </div>
        <div className="mobile-sidebar__label">Mine intelligence</div>
        <nav
          className="mobile-sidebar__nav"
          aria-label="Menu mobile"
        >
          {NAVIGATION.map((item) => (
            <div key={item.key}>
              {item.children ? (
                <div className="mobile-sidebar__group">
                  <div className="mobile-sidebar__group-label">
                    <Icon name={item.icon} />
                    {item.label}
                  </div>
                  {item.children.map((child) => (
                    <button
                      className={`mobile-nav-link ${activeModule === child.key ? "is-active" : ""}`}
                      key={child.key}
                      type="button"
                      onClick={() => onNavigate(child.key)}
                    >
                      <Icon name={child.icon} />
                      {child.label}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className={`mobile-nav-link ${activeModule === item.key ? "is-active" : ""}`}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </nav>
        <div className="mobile-sidebar__footer">
          <div className="sidebar-resource-card">
            <span className="status-badge status-badge--success">
              <span className="status-badge__dot" /> Live demo
            </span>
            <strong>Mine Analytics WH</strong>
            <span>Auto-suspend 60 seconds</span>
          </div>
        </div>
      </aside>
    </>
  );
}
