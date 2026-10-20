import { useState } from "react";

import { MobileSidebar } from "./MobileSidebar";
import { Navbar } from "./Navbar";

export function AppShell({ activeModule, onNavigate, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (moduleKey) => {
    onNavigate(moduleKey);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <MobileSidebar
        open={mobileOpen}
        activeModule={activeModule}
        onClose={() => setMobileOpen(false)}
        onNavigate={handleNavigate}
      />
      <Navbar
        activeModule={activeModule}
        onNavigate={handleNavigate}
        onOpenMobile={() => setMobileOpen(true)}
      />
      <main
        className="main"
        id="page-content"
      >
        {children}
      </main>
    </div>
  );
}
