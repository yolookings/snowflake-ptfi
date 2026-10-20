import { useEffect, useRef, useState } from "react";

import { NAVIGATION } from "../../data/navigation";
import { Icon } from "../ui/Icon";

export function Navbar({ activeModule, onNavigate, onOpenMobile }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navigateAndClose = (moduleKey) => {
    onNavigate(moduleKey);
    setOpenMenu(null);
    setCommandOpen(false);
  };

  return (
    <header className="navbar">
      <div
        className="navbar__inner"
        ref={menuRef}
      >
        <button
          className="icon-button navbar__mobile-toggle"
          type="button"
          onClick={onOpenMobile}
          aria-label="Buka menu"
        >
          <Icon name="bars" />
        </button>
        <button
          className="navbar__brand"
          type="button"
          onClick={() => navigateAndClose("overview")}
        >
          <img
            src="/brand/freeport-light.svg"
            alt="Freeport"
          />
          <span className="navbar__brand-divider" />
          <span className="navbar__brand-copy">
            Mine Intelligence
            <small>Operations &amp; Logistics</small>
          </span>
        </button>

        <nav
          className="navbar__menu"
          aria-label="Navigasi utama"
        >
          {NAVIGATION.map((item) => {
            const isActive =
              item.key === "overview"
                ? activeModule === "overview"
                : item.children?.some((child) => child.key === activeModule) ||
                  item.key === activeModule;
            if (!item.children) {
              return (
                <button
                  className={`navbar__link ${isActive ? "is-active" : ""}`}
                  key={item.key}
                  type="button"
                  onClick={() => navigateAndClose(item.key)}
                >
                  {item.label}
                </button>
              );
            }
            return (
              <div
                className="navbar__menu-group"
                key={item.key}
              >
                <button
                  className={`navbar__link navbar__link--with-caret ${isActive ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setOpenMenu(openMenu === item.key ? null : item.key)}
                  aria-expanded={openMenu === item.key}
                >
                  {item.label}
                  <Icon name="chevron-down" />
                </button>
                {openMenu === item.key && (
                  <div className="navbar-megamenu">
                    <div className="navbar-megamenu__intro">
                      <span className="navbar-megamenu__icon">
                        <Icon name={item.icon} />
                      </span>
                      <div>
                        <strong>Operational workspace</strong>
                        <p>Pantau proses inti dan follow-up operasional dari satu tempat.</p>
                      </div>
                    </div>
                    <div className="navbar-megamenu__items">
                      {item.children.map((child) => (
                        <button
                          type="button"
                          key={child.key}
                          onClick={() => navigateAndClose(child.key)}
                        >
                          <span className="navbar-megamenu__item-icon">
                            <Icon name={child.icon} />
                          </span>
                          <span>
                            <strong>{child.label}</strong>
                            <small>{child.group}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="navbar__actions">
          <button
            className="command-trigger"
            type="button"
            onClick={() => setCommandOpen(true)}
          >
            <Icon name="magnifying-glass" />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </button>
          <button
            className="icon-button icon-button--nav"
            type="button"
            aria-label="Notifikasi"
          >
            <Icon name="bell" />
            <span className="notification-dot" />
          </button>
          <button
            className="profile-button"
            type="button"
          >
            <span className="avatar">AP</span>
            <span className="profile-button__copy">
              <strong>Arif Pratama</strong>
              <small>Ops Intelligence</small>
            </span>
            <Icon name="chevron-down" />
          </button>
        </div>
      </div>

      {commandOpen && (
        <div
          className="command-overlay"
          role="presentation"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="command-palette"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="command-palette__search">
              <Icon name="magnifying-glass" />
              <input
                autoFocus
                placeholder="Cari menu atau halaman..."
                aria-label="Cari menu atau halaman"
              />
              <kbd>ESC</kbd>
            </div>
            <div className="command-palette__label">Jump to module</div>
            {NAVIGATION.flatMap((item) => item.children || [item]).map((item) => (
              <button
                type="button"
                key={item.key}
                onClick={() => navigateAndClose(item.key)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                <Icon name="arrow-up-right-from-square" />
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
