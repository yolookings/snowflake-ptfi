import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { groupBy } from "../data/dashboard";
import { formatDate, formatPercent } from "../lib/formatters";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";
import { MetricCard } from "../components/ui/MetricCard";
import { Panel } from "../components/ui/Panel";
import { SectionHeading } from "../components/ui/SectionHeading";

const STATUS_COLORS = {
  Normal: "#1d9b68",
  Monitoring: "#c98a16",
  Maintenance: "#e81c24",
};

function getAssetSummary(rows) {
  return Object.entries(groupBy(rows, "assetType"))
    .map(([assetType, group]) => ({
      assetType,
      uptime: group.reduce((sum, row) => sum + row.uptimePct, 0) / group.length,
      hours: group.reduce((sum, row) => sum + row.hoursOperating, 0),
    }))
    .sort((a, b) => a.uptime - b.uptime);
}

function getStatusSummary(rows) {
  return Object.entries(groupBy(rows, "maintenanceStatus")).map(([name, group]) => ({
    name,
    value: group.length,
  }));
}

export function FleetEquipment({ data }) {
  const assetSummary = useMemo(() => getAssetSummary(data.equipment), [data.equipment]);
  const statusSummary = useMemo(() => getStatusSummary(data.equipment), [data.equipment]);
  const averageUptime = data.equipment.length
    ? data.equipment.reduce((sum, row) => sum + row.uptimePct, 0) / data.equipment.length
    : 0;
  const operatingHours = data.equipment.reduce((sum, row) => sum + row.hoursOperating, 0);
  const fuelLiters = data.equipment.reduce((sum, row) => sum + row.fuelLiters, 0);
  const latestDate = data.equipment.at(-1)?.date;
  const latestRows = data.equipment
    .filter((row) => row.date === latestDate)
    .sort((a, b) => a.uptimePct - b.uptimePct);
  const attentionCount = latestRows.filter((row) => row.maintenanceStatus !== "Normal").length;

  return (
    <div className="page-content page-content--detail">
      <div className="metric-grid">
        <MetricCard
          label="Average uptime"
          value={formatPercent(averageUptime)}
          delta="Target 85%"
          deltaTone="neutral"
          note="All equipment"
          icon="gauge-high"
          tone="cyan"
        />
        <MetricCard
          label="Operating hours"
          value={`${Math.round(operatingHours).toLocaleString("id-ID")} h`}
          delta="Periode terpilih"
          deltaTone="neutral"
          note="Availability window"
          icon="clock"
          tone="navy"
        />
        <MetricCard
          label="Fuel consumed"
          value={`${Math.round(fuelLiters / 1000).toLocaleString("id-ID")}K L`}
          delta="Fleet aggregate"
          deltaTone="neutral"
          note="Estimated demo data"
          icon="gas-pump"
          tone="gold"
        />
        <MetricCard
          label="Needs attention"
          value={String(attentionCount).padStart(2, "0")}
          delta={`dari ${latestRows.length} asset`}
          deltaTone={attentionCount ? "warning" : "positive"}
          note="Latest snapshot"
          icon="screwdriver-wrench"
          tone="red"
        />
      </div>

      <SectionHeading
        eyebrow="Asset health"
        title="Fleet performance board"
        subtitle="Bandingkan uptime dan status maintenance per tipe alat berat."
      />
      <div className="dashboard-grid dashboard-grid--detail">
        <Panel
          title="Uptime by asset type"
          subtitle="Rata-rata uptime pada periode terpilih."
          className="chart-panel"
        >
          <div className="chart-wrap chart-wrap--fleet-large">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={assetSummary}
                layout="vertical"
                margin={{ top: 8, right: 32, left: 4, bottom: 0 }}
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
                  width={100}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value) => [formatPercent(value), "Uptime"]} />
                <Bar
                  dataKey="uptime"
                  fill="#00b9f2"
                  radius={[0, 6, 6, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel
          title="Maintenance status"
          subtitle={`Latest snapshot · ${formatDate(latestDate)}`}
        >
          <div className="chart-wrap chart-wrap--donut">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={statusSummary}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={102}
                  paddingAngle={4}
                  stroke="none"
                >
                  {statusSummary.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} asset`, name]} />
                <Legend
                  iconType="circle"
                  verticalAlign="bottom"
                  height={30}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="donut-center-label">
            <strong>{latestRows.length}</strong>
            <span>assets</span>
          </div>
        </Panel>
      </div>

      <SectionHeading
        eyebrow="Latest asset register"
        title="Equipment snapshot"
        subtitle="Asset dengan uptime terendah berada di urutan teratas untuk follow-up."
      />
      <Panel>
        <DataTable
          rows={latestRows}
          columns={[
            {
              key: "assetId",
              label: "Asset ID",
              render: (row) => <strong className="table-primary">{row.assetId}</strong>,
            },
            { key: "assetType", label: "Tipe" },
            { key: "pit", label: "Pit" },
            {
              key: "uptimePct",
              label: "Uptime",
              align: "right",
              render: (row) => (
                <span className={row.uptimePct < 72 ? "text-danger" : ""}>
                  {formatPercent(row.uptimePct)}
                </span>
              ),
            },
            {
              key: "hoursOperating",
              label: "Operating hours",
              align: "right",
              render: (row) => `${row.hoursOperating.toFixed(1)} h`,
            },
            {
              key: "maintenanceStatus",
              label: "Status",
              render: (row) => (
                <Badge
                  tone={
                    row.maintenanceStatus === "Normal"
                      ? "success"
                      : row.maintenanceStatus === "Monitoring"
                        ? "warning"
                        : "danger"
                  }
                >
                  {row.maintenanceStatus}
                </Badge>
              ),
            },
          ]}
        />
        <div className="panel-footer-note">
          <Icon name="circle-info" /> Snapshot mengikuti periode paling akhir pada data demo.
        </div>
      </Panel>
    </div>
  );
}
