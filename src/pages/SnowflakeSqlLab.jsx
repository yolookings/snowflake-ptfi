import { useMemo, useState } from "react";

import { groupBy } from "../data/dashboard";
import { formatPercent, formatTonnes } from "../lib/formatters";
import { DataTable } from "../components/ui/DataTable";
import { Icon } from "../components/ui/Icon";
import { Panel } from "../components/ui/Panel";
import { SectionHeading } from "../components/ui/SectionHeading";

const QUERY_EXAMPLES = {
  "Produksi per pit": `SELECT
    pit,
    ROUND(SUM(ore_tonnes), 0) AS total_ore_tonnes,
    ROUND(SUM(ore_tonnes) / NULLIF(SUM(target_tonnes), 0) * 100, 2) AS attainment_pct
FROM production_daily
GROUP BY pit
ORDER BY total_ore_tonnes DESC;`,
  "Uptime alat per tipe": `SELECT
    asset_type,
    ROUND(AVG(uptime_pct), 2) AS avg_uptime_pct,
    COUNT(DISTINCT asset_id) AS asset_count
FROM equipment_daily
GROUP BY asset_type
ORDER BY avg_uptime_pct DESC;`,
  "Shipment readiness": `SELECT
    destination,
    status,
    COUNT(*) AS shipment_count,
    ROUND(AVG(readiness_pct), 2) AS avg_readiness_pct,
    ROUND(SUM(tonnes), 0) AS total_tonnes
FROM logistics_shipments
GROUP BY destination, status
ORDER BY avg_readiness_pct DESC;`,
  "Shift dengan gap terbesar": `SELECT
    shift,
    ROUND(SUM(target_tonnes), 0) AS target_tonnes,
    ROUND(SUM(ore_tonnes), 0) AS actual_tonnes,
    ROUND((SUM(ore_tonnes) - SUM(target_tonnes)) / NULLIF(SUM(target_tonnes), 0) * 100, 2) AS gap_pct
FROM production_daily
GROUP BY shift
ORDER BY gap_pct ASC;`,
};

function aggregateQueryResult(query, data) {
  const normalized = query.toLowerCase();
  if (normalized.includes("equipment_daily")) {
    return Object.entries(groupBy(data.equipment, "assetType"))
      .map(([assetType, rows]) => ({
        asset_type: assetType,
        avg_uptime_pct: rows.reduce((sum, row) => sum + row.uptimePct, 0) / rows.length,
        asset_count: new Set(rows.map((row) => row.assetId)).size,
      }))
      .sort((a, b) => b.avg_uptime_pct - a.avg_uptime_pct);
  }
  if (normalized.includes("logistics_shipments")) {
    return Object.entries(groupBy(data.shipments, "destination"))
      .map(([destination, rows]) => ({
        destination,
        shipment_count: rows.length,
        avg_readiness_pct: rows.reduce((sum, row) => sum + row.readinessPct, 0) / rows.length,
        total_tonnes: rows.reduce((sum, row) => sum + row.tonnes, 0),
      }))
      .sort((a, b) => b.avg_readiness_pct - a.avg_readiness_pct);
  }
  const groupKey = normalized.includes("shift")
    ? "shift"
    : normalized.includes("mineral")
      ? "mineral"
      : "pit";
  return Object.entries(groupBy(data.production, groupKey))
    .map(([label, rows]) => ({
      [groupKey]: label,
      total_ore_tonnes: rows.reduce((sum, row) => sum + row.oreTonnes, 0),
      target_tonnes: rows.reduce((sum, row) => sum + row.targetTonnes, 0),
      attainment_pct:
        (rows.reduce((sum, row) => sum + row.oreTonnes, 0) /
          rows.reduce((sum, row) => sum + row.targetTonnes, 0)) *
        100,
    }))
    .sort((a, b) => b.total_ore_tonnes - a.total_ore_tonnes);
}

function formatResultValue(value, column) {
  if (column.includes("tonnes")) return formatTonnes(value);
  if (column.includes("pct")) return formatPercent(value, 1);
  if (typeof value === "number") return value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  return value;
}

export function SnowflakeSqlLab({ data }) {
  const [selectedExample, setSelectedExample] = useState(Object.keys(QUERY_EXAMPLES)[0]);
  const [query, setQuery] = useState(QUERY_EXAMPLES[Object.keys(QUERY_EXAMPLES)[0]]);
  const [result, setResult] = useState(null);
  const [runState, setRunState] = useState("idle");

  const dictionary = useMemo(
    () => [
      {
        table: "production_daily",
        description: "Produksi ore per tanggal, pit, mineral, dan shift.",
        rows: data.production.length,
        fields: "date · pit · mineral · shift · ore_tonnes · target_tonnes",
      },
      {
        table: "equipment_daily",
        description: "Uptime, jam operasi, fuel, dan status maintenance fleet.",
        rows: data.equipment.length,
        fields: "date · asset_id · asset_type · pit · uptime_pct",
      },
      {
        table: "logistics_shipments",
        description: "Manifest shipment dari source pit menuju destination port.",
        rows: data.shipments.length,
        fields: "shipment_id · vessel · destination · eta_date · readiness_pct",
      },
    ],
    [data],
  );

  const handleExampleChange = (example) => {
    setSelectedExample(example);
    setQuery(QUERY_EXAMPLES[example]);
    setResult(null);
    setRunState("idle");
  };

  const handleRun = () => {
    setResult(aggregateQueryResult(query, data));
    setRunState("success");
  };

  const resultColumns = result?.length
    ? Object.keys(result[0]).map((column) => ({
        key: column,
        label: column.replaceAll("_", " "),
        render: (row) => formatResultValue(row[column], column),
      }))
    : [];

  return (
    <div className="page-content page-content--sql-lab">
      <div className="sql-lab-grid">
        <Panel className="sql-editor-panel">
          <div className="sql-editor__toolbar">
            <div>
              <div className="panel__eyebrow">Query editor</div>
              <h2 className="panel__title">Practice against an operational model</h2>
            </div>
            <span className="connection-pill">
              <span className="status-badge__dot" /> Local preview
            </span>
          </div>
          <div className="query-select-wrap">
            <label htmlFor="query-example">Starter query</label>
            <select
              id="query-example"
              value={selectedExample}
              onChange={(event) => handleExampleChange(event.target.value)}
            >
              {Object.keys(QUERY_EXAMPLES).map((example) => (
                <option
                  value={example}
                  key={example}
                >
                  {example}
                </option>
              ))}
            </select>
          </div>
          <div className="sql-editor">
            <div className="sql-editor__topbar">
              <span />
              <span />
              <span />
              <small>snowflake.sql</small>
            </div>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              spellCheck="false"
              aria-label="SQL query"
            />
          </div>
          <div className="sql-editor__footer">
            <button
              className="button button--primary button--icon"
              type="button"
              onClick={handleRun}
            >
              <Icon name="play" /> Run query
            </button>
            <span>
              <Icon name="circle-info" /> Demo adapter mengagregasi data lokal. SQL siap dipindahkan
              ke Snowflake.
            </span>
          </div>
          {runState === "success" && result && (
            <div className="query-result">
              <div className="query-result__heading">
                <div>
                  <span className="status-badge status-badge--success">
                    <span className="status-badge__dot" /> Query complete
                  </span>
                  <strong>{result.length} rows returned</strong>
                </div>
                <button
                  className="button button--ghost button--icon"
                  type="button"
                >
                  <Icon name="download" /> Export CSV
                </button>
              </div>
              <DataTable
                rows={result}
                columns={resultColumns}
              />
            </div>
          )}
        </Panel>

        <Panel
          title="Practice track"
          subtitle="Naikkan tingkat kesulitan secara bertahap."
        >
          <div className="practice-track">
            <div className="practice-step practice-step--done">
              <span>01</span>
              <div>
                <strong>Explore</strong>
                <p>Ambil sample rows dan kenali field.</p>
              </div>
              <Icon name="circle-check" />
            </div>
            <div className="practice-step practice-step--active">
              <span>02</span>
              <div>
                <strong>Aggregate</strong>
                <p>Bandingkan actual, target, dan attainment.</p>
              </div>
              <Icon name="arrow-right" />
            </div>
            <div className="practice-step">
              <span>03</span>
              <div>
                <strong>Join mindset</strong>
                <p>Gabungkan produksi dengan fleet uptime.</p>
              </div>
              <Icon name="lock" />
            </div>
          </div>
          <div className="sql-tip">
            <Icon name="lightbulb" />
            <div>
              <strong>Cost-aware querying</strong>
              <p>
                Selalu gunakan filter tanggal dan <code>LIMIT</code> ketika eksplorasi data besar.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <SectionHeading
        eyebrow="Schema guide"
        title="Data dictionary"
        subtitle="Tabel demo mengikuti struktur yang sama dengan seed Snowflake di folder snowflake/."
      />
      <div className="dictionary-grid">
        {dictionary.map((item) => (
          <article
            className="dictionary-card"
            key={item.table}
          >
            <div className="dictionary-card__icon">
              <Icon name="table-list" />
            </div>
            <div className="dictionary-card__body">
              <div className="dictionary-card__title">
                <strong>{item.table}</strong>
                <span>{item.rows.toLocaleString("id-ID")} rows</span>
              </div>
              <p>{item.description}</p>
              <code>{item.fields}</code>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
