import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
} from "recharts";

import { DEFAULT_FILTERS, filterDashboardData, groupBy } from "../data/dashboard";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatPercent,
  formatTonnes,
} from "../lib/formatters";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";
import { ProgressBar } from "../components/ui/ProgressBar";

const PALETTE = ["#118dff", "#12239e", "#e66c37", "#6b007b", "#e044a7", "#744ec2", "#d9b300"];
const GRID = "#e6e9ee";
const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] || 0), 0);
const avg = (rows, key) => (rows.length ? sum(rows, key) / rows.length : 0);

function byDay(rows) {
  return Object.entries(groupBy(rows, "date"))
    .map(([date, group]) => ({
      date,
      actual: sum(group, "oreTonnes"),
      target: sum(group, "targetTonnes"),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function byDimension(rows, key) {
  return Object.entries(groupBy(rows, key))
    .map(([label, group]) => ({
      label,
      actual: sum(group, "oreTonnes"),
      target: sum(group, "targetTonnes"),
    }))
    .sort((a, b) => b.actual - a.actual);
}

function Visual({ title, subtitle, span = 4, hint, children }) {
  return (
    <section className={`visual visual--${span}`}>
      <header className="visual__head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {hint && <span className="visual__hint">{hint}</span>}
      </header>
      <div className="visual__body">{children}</div>
    </section>
  );
}

function Kpi({ label, value, note, tone, trend, color }) {
  return (
    <article className="kpi">
      <span className="kpi__label">{label}</span>
      <strong className="kpi__value">{value}</strong>
      {note && <span className={`kpi__note ${tone ? `kpi__note--${tone}` : ""}`}>{note}</span>}
      {trend && trend.length > 1 && (
        <div className="kpi__spark">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart data={trend}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={color}
                fillOpacity={0.12}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

function Empty() {
  return <div className="visual__empty">Tidak ada data untuk filter ini</div>;
}

export function ExecutiveOverview({ data, onNavigate, allData, filters, onFilterChange }) {
  // Power BI style: each visual ignores its own slicer so the selection stays highlighted.
  const contextFor = (key) =>
    filterDashboardData(allData, { ...filters, [key]: DEFAULT_FILTERS[key] });
  const toggle = (key, value) =>
    onFilterChange(key, filters[key] === value ? DEFAULT_FILTERS[key] : value);

  const trend = useMemo(() => byDay(data.production), [data.production]);
  const mineralRows = useMemo(
    () => byDimension(contextFor("mineral").production, "mineral"),
    [allData, filters],
  );
  const pitRows = useMemo(
    () => byDimension(contextFor("pit").production, "pit"),
    [allData, filters],
  );
  const shiftRows = useMemo(
    () => byDimension(contextFor("shift").production, "shift"),
    [allData, filters],
  );
  const fleetStatus = useMemo(
    () =>
      Object.entries(groupBy(data.equipment, "maintenanceStatus")).map(([name, rows]) => ({
        name,
        value: rows.length,
      })),
    [data.equipment],
  );
  const destinations = useMemo(
    () =>
      Object.entries(groupBy(data.shipments, "destination"))
        .map(([label, rows]) => ({ label, tonnes: sum(rows, "tonnes") }))
        .sort((a, b) => b.tonnes - a.tonnes),
    [data.shipments],
  );
  const shipments = useMemo(
    () => [...data.shipments].sort((a, b) => a.etaDate.localeCompare(b.etaDate)).slice(0, 8),
    [data.shipments],
  );

  const totalActual = sum(data.production, "oreTonnes");
  const totalTarget = sum(data.production, "targetTonnes");
  const achievement = totalTarget ? (totalActual / totalTarget) * 100 : 0;
  const totalCost = sum(data.production, "operatingCostUsd");
  const uptime = avg(data.equipment, "uptimePct");
  const shipTonnes = sum(data.shipments, "tonnes");
  const avgGrade = avg(data.production, "gradePct");
  const sparkOre = trend.map((row) => ({ v: row.actual }));
  const sparkAch = trend.map((row) => ({ v: row.target ? (row.actual / row.target) * 100 : 0 }));

  const dimensionBar = (rows, key, color = PALETTE[0]) => (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <BarChart
        data={rows}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          stroke={GRID}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          interval={0}
          tickFormatter={(value) => (value.length > 14 ? `${value.slice(0, 13)}…` : value)}
        />
        <YAxis
          tickFormatter={(value) => formatCompact(value)}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip formatter={(value, name) => [formatTonnes(value), name]} />
        <Legend
          iconType="square"
          iconSize={9}
          wrapperStyle={{ fontSize: 11 }}
        />
        <Bar
          isAnimationActive={false}
          name="Actual"
          dataKey="actual"
          fill={color}
          radius={[2, 2, 0, 0]}
          cursor="pointer"
          onClick={(entry) => toggle(key, entry.label)}
        >
          {rows.map((row) => (
            <Cell
              key={row.label}
              fill={color}
              fillOpacity={
                filters[key] === DEFAULT_FILTERS[key] || filters[key] === row.label ? 1 : 0.3
              }
            />
          ))}
        </Bar>
        <Bar
          isAnimationActive={false}
          name="Target"
          dataKey="target"
          fill="#c4cad3"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="report">
      <div className="kpi-row">
        <Kpi
          label="Total ore"
          value={formatTonnes(totalActual)}
          note={`Target ${formatTonnes(totalTarget)}`}
          trend={sparkOre}
          color={PALETTE[0]}
        />
        <Kpi
          label="Pencapaian target"
          value={formatPercent(achievement)}
          note={achievement >= 100 ? "Di atas target" : "Di bawah target"}
          tone={achievement >= 100 ? "good" : "bad"}
          trend={sparkAch}
          color={achievement >= 100 ? "#1d9b68" : "#d64550"}
        />
        <Kpi
          label="Rata-rata grade"
          value={formatPercent(avgGrade, 2)}
          note={`${data.production.length} catatan produksi`}
        />
        <Kpi
          label="Biaya operasional"
          value={formatCurrency(totalCost)}
          note={`${formatCurrency(totalActual ? totalCost / totalActual : 0)} / ton`}
        />
        <Kpi
          label="Uptime alat"
          value={formatPercent(uptime)}
          note={uptime >= 85 ? "Memenuhi target 85%" : "Di bawah target 85%"}
          tone={uptime >= 85 ? "good" : "bad"}
        />
        <Kpi
          label="Tonase pengiriman"
          value={formatTonnes(shipTonnes)}
          note={`${data.shipments.length} shipment`}
        />
      </div>

      <div className="canvas">
        <Visual
          title="Tren produksi harian"
          subtitle="Actual (kolom) vs target (garis)"
          span={8}
        >
          {trend.length ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ComposedChart
                data={trend}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke={GRID}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDate(value)}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(value) => formatCompact(value)}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value, name) => [formatTonnes(value), name]}
                />
                <Legend
                  iconType="square"
                  iconSize={9}
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Bar
                  isAnimationActive={false}
                  name="Actual"
                  dataKey="actual"
                  fill={PALETTE[0]}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={44}
                />
                <Line
                  isAnimationActive={false}
                  name="Target"
                  dataKey="target"
                  stroke={PALETTE[2]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </Visual>

        <Visual
          title="Komposisi mineral"
          subtitle="Share ore (klik untuk filter)"
          span={4}
        >
          {mineralRows.length ? (
            <div className="donut">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={mineralRows}
                    dataKey="actual"
                    nameKey="label"
                    innerRadius="58%"
                    outerRadius="86%"
                    paddingAngle={2}
                    cursor="pointer"
                    onClick={(entry) => toggle("mineral", entry.label)}
                  >
                    {mineralRows.map((row, index) => (
                      <Cell
                        key={row.label}
                        fill={PALETTE[index % PALETTE.length]}
                        fillOpacity={
                          filters.mineral === DEFAULT_FILTERS.mineral ||
                          filters.mineral === row.label
                            ? 1
                            : 0.25
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatTonnes(value)} />
                  <Legend
                    iconType="square"
                    iconSize={9}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty />
          )}
        </Visual>

        <Visual
          title="Produksi per pit"
          subtitle="Klik kolom untuk filter"
          span={4}
        >
          {pitRows.length ? dimensionBar(pitRows, "pit") : <Empty />}
        </Visual>

        <Visual
          title="Produksi per shift"
          subtitle="Klik kolom untuk filter"
          span={4}
        >
          {shiftRows.length ? dimensionBar(shiftRows, "shift", PALETTE[1]) : <Empty />}
        </Visual>

        <Visual
          title="Status alat berat"
          subtitle="Jumlah catatan per status"
          span={4}
        >
          {fleetStatus.length ? (
            <div className="donut">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={fleetStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="86%"
                    paddingAngle={2}
                  >
                    {fleetStatus.map((row) => (
                      <Cell
                        key={row.name}
                        fill={
                          row.name === "Active" || row.name === "Normal" ? "#1d9b68" : "#d64550"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    iconType="square"
                    iconSize={9}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty />
          )}
        </Visual>

        <Visual
          title="Tonase per tujuan"
          subtitle="Total pengiriman"
          span={5}
        >
          {destinations.length ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={destinations}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  stroke={GRID}
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
                  width={110}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value) => [formatTonnes(value), "Tonase"]} />
                <Bar
                  isAnimationActive={false}
                  dataKey="tonnes"
                  fill={PALETTE[5]}
                  radius={[0, 2, 2, 0]}
                  barSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </Visual>

        <Visual
          title="Daftar pengiriman"
          subtitle="Urut ETA terdekat"
          span={7}
          hint={
            <button
              className="button button--link"
              type="button"
              onClick={() => onNavigate("logistics")}
            >
              Detail <Icon name="arrow-right" />
            </button>
          }
        >
          <div className="visual__scroll">
            <DataTable
              rows={shipments}
              columns={[
                {
                  key: "vessel",
                  label: "Vessel",
                  render: (row) => <strong className="table-primary">{row.vessel}</strong>,
                },
                { key: "destination", label: "Tujuan" },
                { key: "etaDate", label: "ETA", render: (row) => formatDate(row.etaDate) },
                {
                  key: "tonnes",
                  label: "Ton",
                  align: "right",
                  render: (row) => formatCompact(row.tonnes),
                },
                {
                  key: "readinessPct",
                  label: "Ready",
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
          </div>
        </Visual>
      </div>
    </div>
  );
}
