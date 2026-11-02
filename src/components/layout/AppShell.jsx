import { useState } from "react";

import { MobileSidebar } from "./MobileSidebar";
import { Navbar } from "./Navbar";

export function AppShell({ activeModule, onNavigate, user, connectionStatus, children }) {
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
        user={user}
        connectionStatus={connectionStatus}
        onClose={() => setMobileOpen(false)}
        onNavigate={handleNavigate}
      />
      <Navbar
        activeModule={activeModule}
        user={user}
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
