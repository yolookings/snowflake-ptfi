import { useEffect, useMemo, useState } from "react";

import { AppShell } from "./components/layout/AppShell";
import { DataConnectionState } from "./components/ui/DataConnectionState";
import { Badge } from "./components/ui/Badge";
import { FilterBar } from "./components/ui/FilterBar";
import { Icon } from "./components/ui/Icon";
import { PageHeader } from "./components/ui/PageHeader";
import { DEFAULT_FILTERS, EMPTY_DASHBOARD_DATA, filterDashboardData } from "./data/dashboard";
import { MODULE_META } from "./data/navigation";
import { CURRENT_USER } from "./data/users";
import { fetchDashboardData } from "./lib/api";
import { FleetEquipment } from "./pages/FleetEquipment";
import { ExecutiveOverview } from "./pages/ExecutiveOverview";
import { LogisticsControlTower } from "./pages/LogisticsControlTower";
import { ProductionDetail } from "./pages/ProductionDetail";

const PAGE_COPY = {
  overview: {
    subtitle: "Ringkasan produksi, alat berat, dan pengiriman dari database Snowflake.",
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
};

const DEFAULT_SOURCE = {
  database: "FREEPORT_MINING_DB",
  schema: "PUBLIC",
};

function formatTime(date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function renderActivePage(activeModule, data, onNavigate, report) {
  if (activeModule === "production") return <ProductionDetail data={data} />;
  if (activeModule === "fleet") return <FleetEquipment data={data} />;
  if (activeModule === "logistics") return <LogisticsControlTower data={data} />;
  return (
    <ExecutiveOverview
      data={data}
      onNavigate={onNavigate}
      allData={report.allData}
      filters={report.filters}
      onFilterChange={report.onFilterChange}
    />
  );
}

export function App() {
  const [activeModule, setActiveModule] = useState("overview");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [lastSync, setLastSync] = useState(() => new Date());
  const [toast, setToast] = useState(null);
  const [allData, setAllData] = useState(EMPTY_DASHBOARD_DATA);
  const [connection, setConnection] = useState({
    status: "loading",
    message: "Menghubungkan ke Snowflake...",
    source: DEFAULT_SOURCE,
  });
  const filteredData = useMemo(() => filterDashboardData(allData, filters), [allData, filters]);
  const pageMeta = MODULE_META[activeModule];
  const pageCopy = PAGE_COPY[activeModule];
  const hasData = Object.values(allData).some((rows) => rows.length > 0);

  useEffect(() => {
    document.body.dataset.theme = "freeport-blue";
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const applyDashboardPayload = (payload) => {
    const nextData = payload.data || EMPTY_DASHBOARD_DATA;
    const nextStatus =
      payload.status || (payload.mode === "snowflake" ? "connected" : "disconnected");
    setAllData(nextStatus === "connected" ? nextData : EMPTY_DASHBOARD_DATA);
    setConnection({
      status: nextStatus,
      message: payload.message || "Snowflake belum terhubung.",
      source: payload.source || DEFAULT_SOURCE,
    });
    if (nextStatus === "connected") {
      setLastSync(new Date());
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetchDashboardData()
      .then((payload) => {
        if (!cancelled) applyDashboardPayload(payload);
      })
      .catch(() => {
        if (cancelled) return;
        setAllData(EMPTY_DASHBOARD_DATA);
        setConnection({
          status: "disconnected",
          message: "Snowflake belum terhubung. Periksa konfigurasi koneksi Snowflake.",
          source: DEFAULT_SOURCE,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleRefresh = async () => {
    setToast({ tone: "info", message: "Menghubungkan ke Snowflake..." });

    try {
      const payload = await fetchDashboardData();
      applyDashboardPayload(payload);
      setToast({
        tone: payload.status === "connected" ? "success" : "info",
        message:
          payload.status === "connected"
            ? "Data Snowflake berhasil dimuat ulang."
            : payload.message || "Snowflake belum terhubung.",
      });
    } catch {
      setAllData(EMPTY_DASHBOARD_DATA);
      setConnection({
        status: "disconnected",
        message: "Snowflake belum terhubung. Periksa konfigurasi koneksi Snowflake.",
        source: DEFAULT_SOURCE,
      });
      setToast({ tone: "info", message: "Snowflake belum terhubung." });
    }
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
    anchor.download = "freeport-production-snapshot.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setToast({ tone: "info", message: "Snapshot Snowflake berhasil disiapkan sebagai CSV." });
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
        disabled={!hasData}
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

  const connectionTone =
    connection.status === "connected"
      ? "success"
      : connection.status === "loading"
        ? "info"
        : "warning";
  const connectionLabel =
    connection.status === "connected"
      ? "Snowflake terhubung"
      : connection.status === "loading"
        ? "Menghubungkan"
        : "Snowflake belum terhubung";

  return (
    <AppShell
      activeModule={activeModule}
      onNavigate={setActiveModule}
      user={CURRENT_USER}
      connectionStatus={connection.status}
    >
      <PageHeader
        kicker={pageMeta.kicker}
        title={pageMeta.title}
        subtitle={pageCopy.subtitle}
        actions={headerActions}
        meta={
          <div className="header-meta-stack">
            <Badge
              tone={connectionTone}
              dot
            >
              {connectionLabel}
            </Badge>
            <span>
              <strong>{connection.source.database}</strong> | {connection.source.schema}
            </span>
            <span>
              {connection.status === "connected"
                ? `Sync ${formatTime(lastSync)} WIB`
                : "Belum ada sinkronisasi"}
            </span>
          </div>
        }
      />
      {connection.status === "connected" && hasData && (
        <FilterBar
          data={allData}
          filters={filters}
          onChange={handleFilterChange}
          onReset={resetFilters}
          syncTime={`${formatTime(lastSync)} WIB`}
        />
      )}
      {connection.status !== "connected" ? (
        <DataConnectionState
          status={connection.status}
          message={connection.message}
          onRetry={handleRefresh}
        />
      ) : !hasData ? (
        <DataConnectionState
          status="empty"
          message="Snowflake terhubung, tetapi belum ada data pada tabel dashboard."
          onRetry={handleRefresh}
        />
      ) : (
        renderActivePage(activeModule, filteredData, setActiveModule, {
          allData,
          filters,
          onFilterChange: handleFilterChange,
        })
      )}
      <footer className="app-footer">
        <span>PTFI Mine Intelligence</span>
        <span>Source: Snowflake | Read-only dashboard</span>
        <span>
          <Icon name="shield-halved" /> Credential tetap di server
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
