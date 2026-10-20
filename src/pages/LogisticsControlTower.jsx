import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { groupBy } from "../data/dashboard";
import { formatDate, formatPercent, formatTonnes } from "../lib/formatters";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";
import { MetricCard } from "../components/ui/MetricCard";
import { Panel } from "../components/ui/Panel";
import { ProgressBar } from "../components/ui/ProgressBar";
import { SectionHeading } from "../components/ui/SectionHeading";

function statusTone(status) {
  if (status === "Documentation Hold") return "danger";
  if (status === "Ready to Load") return "warning";
  if (status === "At Port") return "info";
  return "success";
}

export function LogisticsControlTower({ data }) {
  const portSummary = useMemo(
    () =>
      Object.entries(groupBy(data.shipments, "destination"))
        .map(([destination, rows]) => ({
          destination,
          tonnes: rows.reduce((sum, row) => sum + row.tonnes, 0),
        }))
        .sort((a, b) => b.tonnes - a.tonnes),
    [data.shipments],
  );
  const readinessRows = useMemo(
    () => [...data.shipments].sort((a, b) => a.readinessPct - b.readinessPct),
    [data.shipments],
  );
  const totalTonnes = data.shipments.reduce((sum, row) => sum + row.tonnes, 0);
  const averageReadiness = data.shipments.length
    ? data.shipments.reduce((sum, row) => sum + row.readinessPct, 0) / data.shipments.length
    : 0;
  const holdCount = data.shipments.filter((row) => row.status === "Documentation Hold").length;
  const inTransit = data.shipments.filter((row) => row.status === "In Transit").length;

  return (
    <div className="page-content page-content--detail">
      <div className="metric-grid">
        <MetricCard
          label="Shipment aktif"
          value={String(data.shipments.length).padStart(2, "0")}
          delta="Manifest terpilih"
          deltaTone="neutral"
          note="Supply chain scope"
          icon="ship"
          tone="cyan"
        />
        <MetricCard
          label="Total muatan"
          value={formatTonnes(totalTonnes)}
          delta="Ore scheduled"
          deltaTone="neutral"
          note="All destinations"
          icon="boxes-stacked"
          tone="navy"
        />
        <MetricCard
          label="Average readiness"
          value={formatPercent(averageReadiness)}
          delta="Target > 85%"
          deltaTone={averageReadiness >= 85 ? "positive" : "warning"}
          note="Manifest readiness"
          icon="clipboard-check"
          tone="gold"
        />
        <MetricCard
          label="Documentation hold"
          value={String(holdCount).padStart(2, "0")}
          delta={`${inTransit} in transit`}
          deltaTone={holdCount ? "warning" : "positive"}
          note="Perlu follow-up"
          icon="file-circle-exclamation"
          tone="red"
        />
      </div>

      <SectionHeading
        eyebrow="Shipment flow"
        title="Port readiness board"
        subtitle="Distribusi volume dan kesiapan berdasarkan tujuan pelabuhan."
      />
      <div className="dashboard-grid dashboard-grid--detail">
        <Panel
          title="Volume by destination"
          subtitle="Total tonase yang masuk ke setiap port."
          className="chart-panel"
        >
          <div className="chart-wrap chart-wrap--fleet-large">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={portSummary}
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
                  tickFormatter={(value) => `${Math.round(value / 1000)}K`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="destination"
                  width={128}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value) => [formatTonnes(value), "Volume"]} />
                <Bar
                  dataKey="tonnes"
                  fill="#0b1f3a"
                  radius={[0, 6, 6, 0]}
                  barSize={26}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel
          title="Readiness watchlist"
          subtitle="Prioritas manifest dengan readiness terendah."
        >
          <div className="readiness-stack">
            {readinessRows.slice(0, 6).map((row) => (
              <div
                className="readiness-row"
                key={row.shipmentId}
              >
                <div className="readiness-row__head">
                  <div>
                    <strong>{row.shipmentId}</strong>
                    <span>
                      {row.vessel} · ETA {formatDate(row.etaDate)}
                    </span>
                  </div>
                  <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                </div>
                <ProgressBar
                  value={row.readinessPct}
                  label={`${row.sourcePit} → ${row.destination}`}
                  tone={row.readinessPct < 80 ? "red" : row.readinessPct < 88 ? "gold" : "green"}
                />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <SectionHeading
        eyebrow="Manifest control"
        title="Shipment manifest"
        subtitle="Gunakan data ini sebagai titik awal drill-down ke SQL Lab."
      />
      <Panel>
        <DataTable
          rows={[...data.shipments].sort((a, b) => a.etaDate.localeCompare(b.etaDate))}
          columns={[
            {
              key: "shipmentId",
              label: "Shipment ID",
              render: (row) => <strong className="table-primary">{row.shipmentId}</strong>,
            },
            { key: "vessel", label: "Vessel" },
            { key: "mineral", label: "Mineral" },
            { key: "sourcePit", label: "Source pit" },
            { key: "destination", label: "Destination" },
            { key: "etaDate", label: "ETA", render: (row) => formatDate(row.etaDate) },
            {
              key: "tonnes",
              label: "Muatan",
              align: "right",
              render: (row) => formatTonnes(row.tonnes),
            },
            {
              key: "readinessPct",
              label: "Ready",
              align: "right",
              render: (row) => formatPercent(row.readinessPct, 0),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
            },
          ]}
        />
        <div className="panel-footer-note">
          <Icon name="circle-info" /> Data manifest sintetis untuk latihan monitoring supply chain.
        </div>
      </Panel>
    </div>
  );
}
