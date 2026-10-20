import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { groupBy, summarizeProduction } from "../data/dashboard";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatPercent,
  formatSignedPercent,
  formatTonnes,
} from "../lib/formatters";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";
import { MetricCard } from "../components/ui/MetricCard";
import { Panel } from "../components/ui/Panel";
import { ProgressBar } from "../components/ui/ProgressBar";
import { SectionHeading } from "../components/ui/SectionHeading";

function getTrendRows(rows) {
  return Object.entries(groupBy(rows, "date"))
    .map(([date, group]) => ({
      date,
      actual: group.reduce((sum, row) => sum + row.oreTonnes, 0),
      target: group.reduce((sum, row) => sum + row.targetTonnes, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getFleetSummary(rows) {
  return Object.entries(groupBy(rows, "assetType"))
    .map(([assetType, group]) => ({
      assetType,
      uptime: group.reduce((sum, row) => sum + row.uptimePct, 0) / group.length,
    }))
    .sort((a, b) => a.uptime - b.uptime);
}

export function ExecutiveOverview({ data, onNavigate }) {
  const [drilldown, setDrilldown] = useState("pit");
  const trendRows = useMemo(() => getTrendRows(data.production), [data.production]);
  const drilldownRows = useMemo(
    () => summarizeProduction(data.production, drilldown),
    [data.production, drilldown],
  );
  const fleetRows = useMemo(() => getFleetSummary(data.equipment), [data.equipment]);
  const latestDate = trendRows.at(-1)?.date;
  const latestProduction = data.production.filter((row) => row.date === latestDate);
  const latestActual = latestProduction.reduce((sum, row) => sum + row.oreTonnes, 0);
  const latestTarget = latestProduction.reduce((sum, row) => sum + row.targetTonnes, 0);
  const uptime = data.equipment.length
    ? data.equipment.reduce((sum, row) => sum + row.uptimePct, 0) / data.equipment.length
    : 0;
  const operatingCost = data.production.reduce((sum, row) => sum + row.operatingCostUsd, 0);
  const readiness = data.shipments.length
    ? data.shipments.reduce((sum, row) => sum + row.readinessPct, 0) / data.shipments.length
    : 0;
  const latestShipments = [...data.shipments]
    .sort((a, b) => a.etaDate.localeCompare(b.etaDate))
    .slice(0, 6);

  return (
    <div className="page-content page-content--overview">
      <div className="metric-grid">
        <MetricCard
          label="Produksi terakhir"
          value={formatTonnes(latestActual)}
          delta={formatSignedPercent(latestActual, latestTarget)}
          note={latestDate ? `Snapshot ${formatDate(latestDate)}` : "No data"}
          icon="chart-line"
          tone="cyan"
        />
        <MetricCard
          label="Uptime alat berat"
          value={formatPercent(uptime)}
          delta="Target 85%"
          deltaTone="neutral"
          note="Periode terpilih"
          icon="gauge-high"
          tone="navy"
        />
        <MetricCard
          label="Biaya operasional"
          value={formatCurrency(operatingCost)}
          delta="Akumulasi periode"
          deltaTone="neutral"
          note="Production operations"
          icon="wallet"
          tone="red"
        />
        <MetricCard
          label="Shipment readiness"
          value={formatPercent(readiness)}
          delta={`${data.shipments.length} shipment aktif`}
          deltaTone={readiness >= 85 ? "positive" : "warning"}
          note="Supply chain control"
          icon="ship"
          tone="gold"
        />
      </div>

      <SectionHeading
        eyebrow="Operational pulse"
        title="Production performance"
        subtitle="Actual ore terhadap target harian pada periode terpilih."
        action={
          <button
            className="button button--link"
            type="button"
            onClick={() => onNavigate("production")}
          >
            Open production detail <Icon name="arrow-right" />
          </button>
        }
      />
      <div className="dashboard-grid dashboard-grid--hero">
        <Panel className="chart-panel">
          <div className="chart-panel__legend">
            <span>
              <i className="legend-dot legend-dot--cyan" /> Actual ore
            </span>
            <span>
              <i className="legend-dot legend-dot--red" /> Target
            </span>
            <span className="chart-panel__muted">Tonnes / day</span>
          </div>
          <div className="chart-wrap chart-wrap--hero">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={trendRows}
                margin={{ top: 12, right: 16, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="actualOre"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#00b9f2"
                      stopOpacity={0.36}
                    />
                    <stop
                      offset="100%"
                      stopColor="#00b9f2"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#edf1f5"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDate(value)}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                />
                <YAxis
                  tickFormatter={(value) => formatCompact(value)}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <Tooltip
                  cursor={{ stroke: "#b8c9d7", strokeDasharray: "4 4" }}
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value, name) => [
                    formatTonnes(value),
                    name === "actual" ? "Actual ore" : "Target",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#00b9f2"
                  strokeWidth={3}
                  fill="url(#actualOre)"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#e81c24"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-panel__footer">
            <span>
              <Icon name="circle-info" /> Trend agregasi seluruh pit dan shift.
            </span>
            <span className="chart-panel__footer-strong">
              {formatTonnes(trendRows.reduce((sum, row) => sum + row.actual, 0))} total ore
            </span>
          </div>
        </Panel>

        <Panel
          title="Drill-down mix"
          subtitle="Klik dimensi untuk membandingkan kontribusi ore."
          actions={
            <select
              className="compact-select"
              value={drilldown}
              onChange={(event) => setDrilldown(event.target.value)}
            >
              <option value="pit">Pit</option>
              <option value="shift">Shift</option>
              <option value="mineral">Mineral</option>
            </select>
          }
          className="chart-panel"
        >
          <div className="chart-wrap chart-wrap--drilldown">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={drilldownRows.sort((a, b) => a.actual - b.actual)}
                layout="vertical"
                margin={{ top: 8, right: 22, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#edf1f5"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCompact(value)}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={112}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value) => [formatTonnes(value), "Actual ore"]} />
                <Bar
                  dataKey="actual"
                  fill="#0b1f3a"
                  radius={[0, 5, 5, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="panel-link-row">
            <span>Highest contribution</span>
            <strong>{drilldownRows.sort((a, b) => b.actual - a.actual)[0]?.label || "—"}</strong>
          </div>
        </Panel>
      </div>

      <SectionHeading
        eyebrow="Readiness signals"
        title="Fleet health & shipment watchlist"
        subtitle="Sinyal operasional yang perlu diperhatikan sebelum masuk ke detail."
      />
      <div className="dashboard-grid dashboard-grid--lower">
        <Panel
          title="Fleet uptime by asset type"
          subtitle="Rata-rata uptime selama periode terpilih."
          actions={
            <button
              className="button button--link"
              type="button"
              onClick={() => onNavigate("fleet")}
            >
              View fleet <Icon name="arrow-right" />
            </button>
          }
          className="chart-panel"
        >
          <div className="chart-wrap chart-wrap--fleet">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={fleetRows}
                layout="vertical"
                margin={{ top: 8, right: 28, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#edf1f5"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="assetType"
                  width={92}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value) => [formatPercent(value), "Uptime"]} />
                <Bar
                  dataKey="uptime"
                  fill="#00b9f2"
                  radius={[0, 5, 5, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Shipment watchlist"
          subtitle="Manifest dengan ETA terdekat."
          actions={
            <button
              className="button button--link"
              type="button"
              onClick={() => onNavigate("logistics")}
            >
              Open control tower <Icon name="arrow-right" />
            </button>
          }
        >
          <DataTable
            rows={latestShipments}
            columns={[
              {
                key: "vessel",
                label: "Vessel",
                render: (row) => <strong className="table-primary">{row.vessel}</strong>,
              },
              {
                key: "destination",
                label: "Destination",
                render: (row) => <span>{row.destination}</span>,
              },
              { key: "etaDate", label: "ETA", render: (row) => formatDate(row.etaDate) },
              {
                key: "readinessPct",
                label: "Ready",
                align: "right",
                render: (row) => (
                  <ProgressBar
                    value={row.readinessPct}
                    showValue
                  />
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <Badge
                    tone={
                      row.status === "Documentation Hold"
                        ? "danger"
                        : row.status === "At Port"
                          ? "info"
                          : "success"
                    }
                  >
                    {row.status}
                  </Badge>
                ),
              },
            ]}
          />
        </Panel>
      </div>

      <div className="insight-strip">
        <div className="insight-strip__icon">
          <Icon name="wand-magic-sparkles" />
        </div>
        <div>
          <strong>Operations insight</strong>
          <p>
            Dokumentasi shipment dengan readiness di bawah 85% sebaiknya di-follow-up sebelum window
            loading berikutnya.
          </p>
        </div>
        <button
          className="button button--dark"
          type="button"
          onClick={() => onNavigate("sql-lab")}
        >
          Explore with SQL <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  );
}
