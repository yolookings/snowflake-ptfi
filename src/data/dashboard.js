export const PERIOD_OPTIONS = [
  { value: "14", label: "14 hari terakhir" },
  { value: "30", label: "30 hari terakhir" },
  { value: "45", label: "45 hari terakhir" },
];

export const DEFAULT_FILTERS = {
  period: "14",
  mineral: "Semua mineral",
  pit: "Semua pit",
  shift: "Semua shift",
};

export const EMPTY_DASHBOARD_DATA = {
  production: [],
  equipment: [],
  shipments: [],
};

function normalizeDate(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function toDateKey(date) {
  const normalized = normalizeDate(date);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const next = normalizeDate(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function getLatestDateFromData(data) {
  const dates = [
    ...data.production.map((row) => row.date),
    ...data.equipment.map((row) => row.date),
    ...data.shipments.map((row) => row.dispatchDate),
    ...data.shipments.map((row) => row.etaDate),
  ].filter(Boolean);

  return dates.sort().at(-1) || "";
}

export function getFilterOptions(data) {
  return {
    mineral: [
      DEFAULT_FILTERS.mineral,
      ...uniqueSorted([
        ...data.production.map((row) => row.mineral),
        ...data.shipments.map((row) => row.mineral),
      ]),
    ],
    pit: [
      DEFAULT_FILTERS.pit,
      ...uniqueSorted([
        ...data.production.map((row) => row.pit),
        ...data.equipment.map((row) => row.pit),
        ...data.shipments.map((row) => row.sourcePit),
      ]),
    ],
    shift: [DEFAULT_FILTERS.shift, ...uniqueSorted(data.production.map((row) => row.shift))],
  };
}

export function filterDashboardData(data, filters) {
  const endDate = getLatestDateFromData(data);
  if (!endDate) return EMPTY_DASHBOARD_DATA;

  const startDate = toDateKey(addDays(endDate, -Number(filters.period) + 1));
  const matchesCommon = (row) => {
    if (row.date && (row.date < startDate || row.date > endDate)) {
      return false;
    }
    if (
      filters.mineral !== DEFAULT_FILTERS.mineral &&
      row.mineral &&
      row.mineral !== filters.mineral
    ) {
      return false;
    }
    if (
      filters.pit !== DEFAULT_FILTERS.pit &&
      row.pit !== filters.pit &&
      row.sourcePit !== filters.pit
    ) {
      return false;
    }
    if (filters.shift !== DEFAULT_FILTERS.shift && row.shift && row.shift !== filters.shift) {
      return false;
    }
    return true;
  };

  return {
    production: data.production.filter(matchesCommon),
    equipment: data.equipment.filter(matchesCommon),
    shipments: data.shipments.filter((row) => {
      if (row.dispatchDate < startDate || row.dispatchDate > endDate) {
        return false;
      }
      if (filters.mineral !== DEFAULT_FILTERS.mineral && row.mineral !== filters.mineral) {
        return false;
      }
      if (filters.pit !== DEFAULT_FILTERS.pit && row.sourcePit !== filters.pit) {
        return false;
      }
      return true;
    }),
  };
}

export function getLatestDate(rows, field = "date") {
  return rows.reduce((latest, row) => (row[field] > latest ? row[field] : latest), "");
}

export function groupBy(rows, key) {
  return rows.reduce((groups, row) => {
    const groupKey = row[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(row);
    return groups;
  }, {});
}

export function summarizeProduction(rows, key) {
  return Object.entries(groupBy(rows, key)).map(([label, group]) => ({
    label,
    actual: group.reduce((sum, row) => sum + row.oreTonnes, 0),
    target: group.reduce((sum, row) => sum + row.targetTonnes, 0),
    cost: group.reduce((sum, row) => sum + row.operatingCostUsd, 0),
  }));
}
