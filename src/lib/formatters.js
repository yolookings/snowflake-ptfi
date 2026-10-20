const ID_NUMBER = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

const ID_DECIMAL = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const ID_DATE = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return ID_NUMBER.format(value);
}

export function formatDecimal(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return ID_DECIMAL.format(value);
}

export function formatCompact(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (absolute >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

export function formatTonnes(value) {
  return `${formatCompact(value)} t`;
}

export function formatCurrency(value) {
  return `US$ ${formatCompact(value)}`;
}

export function formatDate(value, options = {}) {
  if (!value) {
    return "-";
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    ...options,
  }).format(date);
}

export function formatLongDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "-" : ID_DATE.format(date);
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return `${Number(value).toFixed(decimals)}%`;
}

export function formatSignedPercent(actual, target) {
  if (!target) {
    return "-";
  }
  const delta = (actual / target - 1) * 100;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs target`;
}
