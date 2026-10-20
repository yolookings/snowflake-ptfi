const PITS = [
  { name: "Grasberg", region: "Papua", factor: 1.16 },
  { name: "Kucing Liar", region: "Papua", factor: 1.04 },
  { name: "Deep Mill Level Zone", region: "Papua", factor: 0.93 },
  { name: "Big Gossan", region: "Papua", factor: 0.82 },
];

const MINERALS = [
  { name: "Copper", factor: 1, grade: 0.62 },
  { name: "Gold", factor: 0.64, grade: 1.84 },
  { name: "Silver", factor: 0.48, grade: 5.71 },
];

const SHIFTS = [
  { name: "Shift 1", factor: 1.04 },
  { name: "Shift 2", factor: 1 },
  { name: "Shift 3", factor: 0.91 },
];

const ASSETS = [
  ["TRK-101", "Haul Truck", "Grasberg"],
  ["TRK-102", "Haul Truck", "Grasberg"],
  ["TRK-103", "Haul Truck", "Kucing Liar"],
  ["TRK-104", "Haul Truck", "Kucing Liar"],
  ["EXC-201", "Excavator", "Grasberg"],
  ["EXC-202", "Excavator", "Deep Mill Level Zone"],
  ["EXC-203", "Excavator", "Big Gossan"],
  ["DZR-301", "Dozer", "Grasberg"],
  ["DZR-302", "Dozer", "Kucing Liar"],
  ["LDR-401", "Loader", "Deep Mill Level Zone"],
  ["LDR-402", "Loader", "Big Gossan"],
  ["DRL-501", "Drill", "Grasberg"],
];

const DESTINATIONS = ["Port Amamapare", "Port Tanjung Priok", "Port Morowali"];
const VESSELS = [
  "MV Amamapare",
  "MV Papua Star",
  "MV Nusantara Ore",
  "MV Lontar Jaya",
  "MV Timika Express",
  "MV Pacific Mineral",
];
const SHIPMENT_STATUSES = ["In Transit", "Ready to Load", "At Port", "Documentation Hold"];

export const PIT_OPTIONS = ["Semua pit", ...PITS.map((pit) => pit.name)];
export const MINERAL_OPTIONS = ["Semua mineral", ...MINERALS.map((mineral) => mineral.name)];
export const SHIFT_OPTIONS = ["Semua shift", ...SHIFTS.map((shift) => shift.name)];
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

function createRandom(seed) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

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

export function getDataEndDate() {
  return toDateKey(new Date());
}

export function createDashboardData() {
  const random = createRandom(20261020);
  const endDate = normalizeDate(new Date());
  const production = [];
  const equipment = [];

  for (let dayIndex = 0; dayIndex < 45; dayIndex += 1) {
    const operationDate = addDays(endDate, -44 + dayIndex);
    const date = toDateKey(operationDate);
    const seasonalFactor = 1 + 0.04 * Math.sin(dayIndex / 3.4);

    PITS.forEach((pit) => {
      MINERALS.forEach((mineral) => {
        SHIFTS.forEach((shift) => {
          const target = 6900 * pit.factor * mineral.factor * shift.factor;
          const volatility = (random() - 0.5) * 0.05;
          const attainment = 0.91 + 0.035 * Math.cos(dayIndex / 6) + volatility;
          const oreTonnes = Math.max(target * seasonalFactor * attainment, 1000);
          production.push({
            date,
            region: pit.region,
            pit: pit.name,
            mineral: mineral.name,
            shift: shift.name,
            oreTonnes,
            targetTonnes: target * seasonalFactor,
            gradePct: mineral.grade * (1 + (random() - 0.5) * 0.07),
            operatingCostUsd: oreTonnes * (8.6 + random() * 2.2),
            loadedTrucks: Math.max(8, Math.round(oreTonnes / (520 + random() * 180))),
          });
        });
      });
    });

    ASSETS.forEach(([assetId, assetType, pit], assetIndex) => {
      const baseline = 0.86 + 0.035 * Math.sin((dayIndex + assetIndex) / 5);
      const maintenanceEvent = (dayIndex * 3 + assetIndex) % 41 === 0;
      let uptime = Math.min(0.99, Math.max(0.68, baseline + (random() - 0.5) * 0.05));
      if (maintenanceEvent) {
        uptime = Math.min(uptime, 0.62);
      }
      const maintenanceStatus =
        uptime >= 0.85 ? "Normal" : uptime >= 0.72 ? "Monitoring" : "Maintenance";
      equipment.push({
        date,
        assetId,
        assetType,
        pit,
        hoursAvailable: 24,
        hoursOperating: 24 * uptime,
        uptimePct: uptime * 100,
        fuelLiters: 780 * (0.75 + uptime * 0.28),
        maintenanceStatus,
      });
    });
  }

  const shipments = Array.from({ length: 18 }, (_, shipmentIndex) => {
    const dispatchDate = addDays(endDate, -11 + (shipmentIndex % 9));
    const etaDate = addDays(dispatchDate, 3 + (shipmentIndex % 6));
    const status = SHIPMENT_STATUSES[shipmentIndex % SHIPMENT_STATUSES.length];
    let readiness = 72 + ((shipmentIndex * 11) % 27);
    if (status === "Documentation Hold") {
      readiness = Math.min(readiness, 76);
    }
    return {
      shipmentId: `SHP-${String(endDate.getFullYear()).slice(-2)}${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(shipmentIndex + 1).padStart(3, "0")}`,
      vessel: VESSELS[shipmentIndex % VESSELS.length],
      mineral: MINERALS[shipmentIndex % MINERALS.length].name,
      sourcePit: PITS[shipmentIndex % PITS.length].name,
      destination: DESTINATIONS[shipmentIndex % DESTINATIONS.length],
      dispatchDate: toDateKey(dispatchDate),
      etaDate: toDateKey(etaDate),
      tonnes: 18500 + ((shipmentIndex * 2175) % 12000),
      readinessPct: readiness,
      status,
    };
  });

  return { production, equipment, shipments };
}

export function filterDashboardData(data, filters) {
  const endDate = getDataEndDate();
  const startDate = toDateKey(addDays(endDate, -Number(filters.period) + 1));
  const matchesCommon = (row) => {
    if (row.date && (row.date < startDate || row.date > endDate)) {
      return false;
    }
    if (filters.mineral !== "Semua mineral" && row.mineral && row.mineral !== filters.mineral) {
      return false;
    }
    if (filters.pit !== "Semua pit" && row.pit !== filters.pit && row.sourcePit !== filters.pit) {
      return false;
    }
    if (filters.shift !== "Semua shift" && row.shift && row.shift !== filters.shift) {
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
      if (filters.mineral !== "Semua mineral" && row.mineral !== filters.mineral) {
        return false;
      }
      if (filters.pit !== "Semua pit" && row.sourcePit !== filters.pit) {
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
