import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { summarizeProduction } from "../data/dashboard";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatSignedPercent,
  formatTonnes,
} from "../lib/formatters";
import { DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";
import { MetricCard } from "../components/ui/MetricCard";
import { Panel } from "../components/ui/Panel";
import { SectionHeading } from "../components/ui/SectionHeading";

const DIMENSIONS = [
  { key: "pit", label: "Pit" },
  { key: "mineral", label: "Mineral" },
  { key: "shift", label: "Shift" },
];

export function ProductionDetail({ data }) {
  const [dimension, setDimension] = useState("pit");
  const contribution = useMemo(
    () => summarizeProduction(data.production, dimension),
    [data.production, dimension],
  );
  const sortedContribution = [...contribution].sort((a, b) => b.actual - a.actual);
  const actual = data.production.reduce((sum, row) => sum + row.oreTonnes, 0);
  const target = data.production.reduce((sum, row) => sum + row.targetTonnes, 0);
  const averageGrade = data.production.length
    ? data.production.reduce((sum, row) => sum + row.gradePct, 0) / data.production.length
    : 0;
  const operatingCost = data.production.reduce((sum, row) => sum + row.operatingCostUsd, 0);
  const rows = data.production.slice(-80).reverse();

  return (
    <div className="page-content page-content--detail">
      <div className="metric-grid">
        <MetricCard
          label="Actual ore"
          value={formatTonnes(actual)}
          delta={formatSignedPercent(actual, target)}
          note="Periode terpilih"
          icon="boxes-stacked"
          tone="cyan"
        />
        <MetricCard
          label="Target ore"
          value={formatTonnes(target)}
          delta="Production plan"
          deltaTone="neutral"
          note="Semua dimensi"
          icon="bullseye"
          tone="navy"
        />
        <MetricCard
          label="Average grade"
          value={formatPercent(averageGrade, 2)}
          delta="Quality signal"
          deltaTone="neutral"
          note="Weighted demo data"
          icon="flask"
          tone="gold"
        />
        <MetricCard
          label="Production opex"
          value={formatCurrency(operatingCost)}
          delta="Akumulasi"
          deltaTone="neutral"
          note="Simulasi cost"
          icon="coins"
          tone="red"
        />
      </div>

      <SectionHeading
        eyebrow=""
        title="Production by dimension"
        subtitle="Ubah dimensi untuk melihat konsentrasi produksi terbesar."
        action={
          <div
            className="segmented-control"
            role="tablist"
            aria-label="Dimensi produksi"
          >
            {DIMENSIONS.map((item) => (
              <button
                className={dimension === item.key ? "is-active" : ""}
                type="button"
                key={item.key}
                onClick={() => setDimension(item.key)}
                role="tab"
                aria-selected={dimension === item.key}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="dashboard-grid dashboard-grid--detail">
        <Panel className="chart-panel">
          <div className="chart-wrap chart-wrap--contribution">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={sortedContribution}
                margin={{ top: 12, right: 18, left: -8, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="#e2e8ec"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `${Math.round(value / 1000)}K`}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <Tooltip formatter={(value) => [formatTonnes(value), "Actual ore"]} />
                <Bar
                  dataKey="actual"
                  fill="var(--color-primary)"
                  radius={[2, 2, 0, 0]}
                  barSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel
          title="Attainment snapshot"
          subtitle="Actual terhadap target per dimensi."
        >
          <div className="attainment-list">
            {sortedContribution.map((row, index) => {
              const attainment = (row.actual / row.target) * 100;
              return (
                <div
                  className="attainment-row"
                  key={row.label}
                >
                  <div className="attainment-row__label">
                    <span className="rank-chip">{String(index + 1).padStart(2, "0")}</span>
                    <strong>{row.label}</strong>
                    <span>{formatTonnes(row.actual)}</span>
                  </div>
                  <div className="attainment-row__track">
                    <span style={{ width: `${Math.min(100, attainment)}%` }} />
                  </div>
                  <strong className={attainment >= 100 ? "text-success" : "text-warning"}>
                    {attainment.toFixed(1)}%
                  </strong>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <SectionHeading
        eyebrow=""
        title="Production rows"
        subtitle="Baris teragregasi ini sengaja dibuat dekat dengan struktur tabel Snowflake untuk latihan validasi query."
        action={
          <span className="section-heading__count">
            {data.production.length.toLocaleString("id-ID")} rows in scope
          </span>
        }
      />
      <Panel>
        <DataTable
          rows={rows}
          columns={[
            { key: "date", label: "Tanggal", render: (row) => formatDate(row.date) },
            {
              key: "pit",
              label: "Pit",
              render: (row) => <strong className="table-primary">{row.pit}</strong>,
            },
            { key: "mineral", label: "Mineral" },
            { key: "shift", label: "Shift" },
            {
              key: "oreTonnes",
              label: "Actual ore",
              align: "right",
              render: (row) => formatTonnes(row.oreTonnes),
            },
            {
              key: "targetTonnes",
              label: "Target",
              align: "right",
              render: (row) => formatTonnes(row.targetTonnes),
            },
            {
              key: "gradePct",
              label: "Grade",
              align: "right",
              render: (row) => formatPercent(row.gradePct, 2),
            },
          ]}
        />
        <div className="panel-footer-note">
          <Icon name="circle-info" /> Menampilkan 80 baris terbaru dari scope filter aktif.
        </div>
      </Panel>
    </div>
  );
}
