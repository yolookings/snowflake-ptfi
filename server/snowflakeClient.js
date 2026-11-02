import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const snowflake = require("snowflake-sdk");

// Vercel's filesystem is read-only except /tmp, so the SDK log file must live there.
if (process.env.VERCEL) {
  snowflake.configure({ logLevel: "ERROR", logFilePath: "/tmp/snowflake.log" });
}

const config = {
  account: process.env.SNOWFLAKE_ACCOUNT?.trim(),
  username: process.env.SNOWFLAKE_USER?.trim(),
  password: process.env.SNOWFLAKE_PASSWORD || "",
  role: process.env.SNOWFLAKE_ROLE?.trim(),
  warehouse: process.env.SNOWFLAKE_WAREHOUSE?.trim() || "MINE_ANALYTICS_WH",
  database: process.env.SNOWFLAKE_DATABASE?.trim() || "FREEPORT_MINING_DB",
  schema: process.env.SNOWFLAKE_SCHEMA?.trim() || "PUBLIC",
  authenticator: process.env.SNOWFLAKE_AUTHENTICATOR?.trim() || "snowflake",
  privateKeyPath: process.env.SNOWFLAKE_PRIVATE_KEY_PATH?.trim(),
  productionTable: process.env.SNOWFLAKE_PRODUCTION_TABLE?.trim() || "PRODUCTION",
  equipmentTable: process.env.SNOWFLAKE_EQUIPMENT_TABLE?.trim() || "EQUIPMENT",
  shipmentTable: process.env.SNOWFLAKE_SHIPMENT_TABLE?.trim() || "SHIPMENT",
};

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_$]*$/;
const EMPTY_DASHBOARD_DATA = {
  production: [],
  equipment: [],
  shipments: [],
};
let connectionPromise;

function isConfigured() {
  return Boolean(config.account && config.username && (config.password || config.privateKeyPath));
}

function safeIdentifier(value, label) {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`${label} contains an invalid Snowflake identifier.`);
  }
  return value.toUpperCase();
}

function tableName(table) {
  return [
    safeIdentifier(config.database, "SNOWFLAKE_DATABASE"),
    safeIdentifier(config.schema, "SNOWFLAKE_SCHEMA"),
    safeIdentifier(table, "table"),
  ].join(".");
}

function sourceInfo() {
  return {
    database: config.database,
    schema: config.schema,
  };
}

function emptyData() {
  return {
    production: [...EMPTY_DASHBOARD_DATA.production],
    equipment: [...EMPTY_DASHBOARD_DATA.equipment],
    shipments: [...EMPTY_DASHBOARD_DATA.shipments],
  };
}

function describeError(error) {
  return {
    code: error?.code || null,
    sqlState: error?.sqlState || null,
    message: error?.message || String(error),
  };
}

function disconnectedPayload(message) {
  return {
    status: "disconnected",
    mode: "disconnected",
    message,
    data: emptyData(),
    source: sourceInfo(),
  };
}

function getField(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
    if (row[key.toUpperCase()] !== undefined) return row[key.toUpperCase()];
    if (row[key.toLowerCase()] !== undefined) return row[key.toLowerCase()];
  }
  return null;
}

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProductionRow(row) {
  return {
    date: normalizeDate(getField(row, "operation_date", "date")),
    region: String(getField(row, "region") || ""),
    pit: String(getField(row, "pit_name", "pit") || ""),
    mineral: String(getField(row, "mineral") || ""),
    shift: String(getField(row, "shift") || ""),
    oreTonnes: numberValue(getField(row, "ore_tonnes", "oreTonnes")),
    targetTonnes: numberValue(getField(row, "target_tonnes", "targetTonnes")),
    gradePct: numberValue(getField(row, "grade_pct", "gradePct")),
    operatingCostUsd: numberValue(getField(row, "operating_cost_usd", "operatingCostUsd")),
    loadedTrucks: numberValue(getField(row, "loaded_trucks", "loadedTrucks")),
  };
}

function normalizeEquipmentRow(row) {
  return {
    date: normalizeDate(getField(row, "operation_date", "date")),
    assetId: String(getField(row, "asset_id", "assetId") || ""),
    assetType: String(getField(row, "asset_type", "assetType") || ""),
    pit: String(getField(row, "pit_name", "pit") || ""),
    hoursAvailable: numberValue(getField(row, "hours_available", "hoursAvailable")),
    hoursOperating: numberValue(getField(row, "hours_operating", "hoursOperating")),
    uptimePct: numberValue(getField(row, "uptime_pct", "uptimePct")),
    fuelLiters: numberValue(getField(row, "fuel_liters", "fuelLiters")),
    maintenanceStatus: String(getField(row, "maintenance_status", "maintenanceStatus") || ""),
  };
}

function normalizeShipmentRow(row) {
  return {
    shipmentId: String(getField(row, "shipment_id", "shipmentId") || ""),
    vessel: String(getField(row, "vessel_name", "vessel") || ""),
    mineral: String(getField(row, "mineral") || ""),
    sourcePit: String(getField(row, "source_pit", "sourcePit") || ""),
    destination: String(getField(row, "destination_port", "destination") || ""),
    dispatchDate: normalizeDate(getField(row, "dispatch_date", "dispatchDate")),
    etaDate: normalizeDate(getField(row, "eta_date", "etaDate")),
    tonnes: numberValue(getField(row, "tonnes")),
    readinessPct: numberValue(getField(row, "readiness_pct", "readinessPct")),
    status: String(getField(row, "status") || ""),
  };
}

function connect() {
  if (!isConfigured()) {
    return Promise.reject(new Error("Snowflake credentials are not configured."));
  }
  if (connectionPromise) return connectionPromise;

  const options = {
    account: config.account,
    username: config.username,
    warehouse: config.warehouse,
    database: config.database,
    schema: config.schema,
    authenticator: config.authenticator,
  };

  if (config.role) options.role = config.role;
  if (config.password) options.password = config.password;
  if (config.privateKeyPath) {
    options.privateKey = fs.readFileSync(path.resolve(config.privateKeyPath));
  }

  connectionPromise = new Promise((resolve, reject) => {
    const connection = snowflake.createConnection(options);
    connection.connect((error, connectedConnection) => {
      if (error) {
        connectionPromise = undefined;
        console.error("[Snowflake connection error]", describeError(error));
        reject(error);
        return;
      }
      resolve(connectedConnection);
    });
  });

  return connectionPromise;
}

async function execute(sqlText) {
  const connection = await connect();
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      complete(error, statement, rows) {
        if (error) {
          console.error("[Snowflake query error]", describeError(error));
          reject(error);
          return;
        }
        resolve({ statement, rows: rows || [] });
      },
    });
  });
}

export function snowflakeStatus() {
  return isConfigured() ? "configured" : "not-configured";
}

export async function getDashboardData() {
  if (!isConfigured()) {
    return disconnectedPayload(
      "Snowflake belum terhubung. Isi konfigurasi Snowflake untuk menampilkan data.",
    );
  }

  try {
    const [productionResult, equipmentResult, shipmentResult] = await Promise.all([
      execute(
        `SELECT OPERATION_DATE, REGION, PIT_NAME, MINERAL, SHIFT, ORE_TONNES, TARGET_TONNES, GRADE_PCT, OPERATING_COST_USD, LOADED_TRUCKS
FROM ${tableName(config.productionTable)}
WHERE OPERATION_DATE >= DATEADD(day, -44, CURRENT_DATE())
ORDER BY OPERATION_DATE`,
      ),
      execute(
        `SELECT OPERATION_DATE, ASSET_ID, ASSET_TYPE, PIT_NAME, HOURS_AVAILABLE, HOURS_OPERATING, UPTIME_PCT, FUEL_LITERS, MAINTENANCE_STATUS
FROM ${tableName(config.equipmentTable)}
WHERE OPERATION_DATE >= DATEADD(day, -44, CURRENT_DATE())
ORDER BY OPERATION_DATE`,
      ),
      execute(
        `SELECT SHIPMENT_ID, VESSEL_NAME, MINERAL, SOURCE_PIT, DESTINATION_PORT, DISPATCH_DATE, ETA_DATE, TONNES, READINESS_PCT, STATUS
FROM ${tableName(config.shipmentTable)}
ORDER BY ETA_DATE`,
      ),
    ]);

    const data = {
      production: productionResult.rows.map(normalizeProductionRow),
      equipment: equipmentResult.rows.map(normalizeEquipmentRow),
      shipments: shipmentResult.rows.map(normalizeShipmentRow),
    };

    return {
      status: "connected",
      mode: "snowflake",
      message:
        data.production.length || data.equipment.length || data.shipments.length
          ? null
          : "Snowflake terhubung, tetapi tabel dashboard belum berisi data.",
      data,
      source: sourceInfo(),
    };
  } catch (error) {
    connectionPromise = undefined;
    console.error("[Snowflake dashboard error]", describeError(error));
    return disconnectedPayload(
      "Snowflake belum terhubung. Periksa account, user, password, schema, dan nama tabel.",
    );
  }
}
