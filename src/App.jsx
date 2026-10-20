import { useEffect, useMemo, useState } from "react";

import { AppShell } from "./components/layout/AppShell";
import { Badge } from "./components/ui/Badge";
import { FilterBar } from "./components/ui/FilterBar";
import { Icon } from "./components/ui/Icon";
import { PageHeader } from "./components/ui/PageHeader";
import { DEFAULT_FILTERS, createDashboardData, filterDashboardData } from "./data/dashboard";
import { MODULE_META } from "./data/navigation";
import { FleetEquipment } from "./pages/FleetEquipment";
import { ExecutiveOverview } from "./pages/ExecutiveOverview";
import { LogisticsControlTower } from "./pages/LogisticsControlTower";
import { ProductionDetail } from "./pages/ProductionDetail";
import { SnowflakeSqlLab } from "./pages/SnowflakeSqlLab";

const PAGE_COPY = {
  overview: {
    subtitle: "Ringkasan produksi, alat berat, dan pengiriman untuk periode yang dipilih.",
  },
  production: {
    subtitle: "Bandingkan hasil produksi menurut pit, mineral, dan shift.",
  },
  fleet: {
    subtitle: "Tinjau uptime, jam operasi, dan status maintenance alat berat.",
  },
  logistics: {
    subtitle: "Pantau readiness, ETA, tujuan, dan status pengiriman.",
  },
  "sql-lab": {
    subtitle: "Jalankan contoh query terhadap data demo dan lihat hasil agregasinya.",
  },
};

function formatTime(date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function renderActivePage(activeModule, data, onNavigate) {
  if (activeModule === "production") return <ProductionDetail data={data} />;
  if (activeModule === "fleet") return <FleetEquipment data={data} />;
  if (activeModule === "logistics") return <LogisticsControlTower data={data} />;
  if (activeModule === "sql-lab") return <SnowflakeSqlLab data={data} />;
  return (
    <ExecutiveOverview
      data={data}
      onNavigate={onNavigate}
    />
  );
}

export function App() {
  const [activeModule, setActiveModule] = useState("overview");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [lastSync, setLastSync] = useState(() => new Date());
  const [toast, setToast] = useState(null);
  const allData = useMemo(() => createDashboardData(), []);
  const filteredData = useMemo(() => filterDashboardData(allData, filters), [allData, filters]);
  const pageMeta = MODULE_META[activeModule];
  const pageCopy = PAGE_COPY[activeModule];

  useEffect(() => {
    document.body.dataset.theme = "freeport-blue";
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleRefresh = () => {
    setLastSync(new Date());
    setToast({ tone: "success", message: "Data demo berhasil disinkronkan ulang." });
  };

  const handleExport = () => {
    const columns = [
      ["date", "date"],
      ["pit", "pit"],
      ["mineral", "mineral"],
      ["shift", "shift"],
      ["ore_tonnes", "oreTonnes"],
      ["target_tonnes", "targetTonnes"],
      ["grade_pct", "gradePct"],
    ];
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csvRows = filteredData.production.map((row) =>
      columns.map(([, key]) => escapeCsv(row[key])),
    );
    const content = [
      columns.map(([header]) => header).join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ptfi-production-snapshot.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setToast({ tone: "info", message: "Snapshot produksi berhasil disiapkan sebagai CSV." });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setToast({ tone: "info", message: "Filter dikembalikan ke tampilan default." });
  };

  const headerActions = (
    <>
      <button
        className="button button--ghost button--icon"
        type="button"
        onClick={handleExport}
      >
        <Icon name="download" /> Export snapshot
      </button>
      <button
        className="button button--primary button--icon"
        type="button"
        onClick={handleRefresh}
      >
        <Icon name="rotate" /> Refresh data
      </button>
    </>
  );

  return (
    <AppShell
      activeModule={activeModule}
      onNavigate={setActiveModule}
    >
      <PageHeader
        kicker={pageMeta.kicker}
        title={pageMeta.title}
        subtitle={pageCopy.subtitle}
        actions={headerActions}
        meta={
          <div className="header-meta-stack">
            <Badge
              tone="success"
              dot
            >
              Demo data
            </Badge>
            <span>
              <strong>MINE_ANALYTICS_WH</strong> | Auto-suspend 60s
            </span>
            <span>Sync {formatTime(lastSync)} WIB</span>
          </div>
        }
      />
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={resetFilters}
        onRefresh={handleRefresh}
        syncTime={`${formatTime(lastSync)} WIB`}
      />
      {renderActivePage(activeModule, filteredData, setActiveModule)}
      <footer className="app-footer">
        <span>PTFI Mine Intelligence</span>
        <span>Prototype | Data sintetis untuk latihan query</span>
        <span>
          <Icon name="shield-halved" /> Cost guardrail active
        </span>
      </footer>
      {toast && (
        <div
          className={`toast toast--${toast.tone}`}
          role="status"
        >
          <Icon name={toast.tone === "success" ? "circle-check" : "circle-info"} />
          {toast.message}
        </div>
      )}
    </AppShell>
  );
}
