-- Seed deterministic demo data. Run 01_create_objects.sql first.
-- This script resets only the three practice tables.

USE DATABASE PTFI_MINE_ANALYTICS;
USE SCHEMA OPERATIONS;
USE WAREHOUSE MINE_ANALYTICS_WH;

TRUNCATE TABLE PRODUCTION_DAILY;
TRUNCATE TABLE EQUIPMENT_DAILY;
TRUNCATE TABLE LOGISTICS_SHIPMENTS;

INSERT INTO PRODUCTION_DAILY (
    OPERATION_DATE,
    REGION,
    PIT_NAME,
    MINERAL,
    SHIFT,
    ORE_TONNES,
    TARGET_TONNES,
    GRADE_PCT,
    OPERATING_COST_USD,
    LOADED_TRUCKS
)
WITH day_spine AS (
    SELECT SEQ4()::INTEGER AS DAY_OFFSET
    FROM TABLE(GENERATOR(ROWCOUNT => 45))
),
pits AS (
    SELECT COLUMN1::VARCHAR AS PIT_NAME, COLUMN2::VARCHAR AS REGION, COLUMN3::FLOAT AS PIT_FACTOR
    FROM VALUES
        ('Grasberg', 'Papua', 1.16),
        ('Kucing Liar', 'Papua', 1.04),
        ('Deep Mill Level Zone', 'Papua', 0.93),
        ('Big Gossan', 'Papua', 0.82)
),
minerals AS (
    SELECT COLUMN1::VARCHAR AS MINERAL, COLUMN2::FLOAT AS MINERAL_FACTOR, COLUMN3::FLOAT AS BASE_GRADE
    FROM VALUES
        ('Copper', 1.00, 0.62),
        ('Gold', 0.64, 1.84),
        ('Silver', 0.48, 5.71)
),
shifts AS (
    SELECT COLUMN1::VARCHAR AS SHIFT, COLUMN2::FLOAT AS SHIFT_FACTOR
    FROM VALUES
        ('Shift 1', 1.04),
        ('Shift 2', 1.00),
        ('Shift 3', 0.91)
)
SELECT
    DATEADD('day', -d.DAY_OFFSET, CURRENT_DATE()),
    p.REGION,
    p.PIT_NAME,
    m.MINERAL,
    s.SHIFT,
    ROUND(
        6900 * p.PIT_FACTOR * m.MINERAL_FACTOR * s.SHIFT_FACTOR
        * (0.91 + 0.035 * COS(d.DAY_OFFSET / 6.0) + MOD(d.DAY_OFFSET * 7, 5) / 1000.0),
        2
    ) AS ORE_TONNES,
    ROUND(6900 * p.PIT_FACTOR * m.MINERAL_FACTOR * s.SHIFT_FACTOR, 2) AS TARGET_TONNES,
    ROUND(m.BASE_GRADE * (1 + MOD(d.DAY_OFFSET * 11, 7) / 1000.0), 3) AS GRADE_PCT,
    ROUND(
        6900 * p.PIT_FACTOR * m.MINERAL_FACTOR * s.SHIFT_FACTOR
        * (0.91 + 0.035 * COS(d.DAY_OFFSET / 6.0)) * 9.7,
        2
    ) AS OPERATING_COST_USD,
    ROUND(
        6900 * p.PIT_FACTOR * m.MINERAL_FACTOR * s.SHIFT_FACTOR
        * (0.91 + 0.035 * COS(d.DAY_OFFSET / 6.0)) / 620,
        0
    ) AS LOADED_TRUCKS
FROM day_spine d
CROSS JOIN pits p
CROSS JOIN minerals m
CROSS JOIN shifts s;

INSERT INTO EQUIPMENT_DAILY (
    OPERATION_DATE,
    ASSET_ID,
    ASSET_TYPE,
    PIT_NAME,
    HOURS_AVAILABLE,
    HOURS_OPERATING,
    UPTIME_PCT,
    FUEL_LITERS,
    MAINTENANCE_STATUS
)
WITH day_spine AS (
    SELECT SEQ4()::INTEGER AS DAY_OFFSET
    FROM TABLE(GENERATOR(ROWCOUNT => 45))
),
assets AS (
    SELECT COLUMN1::VARCHAR AS ASSET_ID, COLUMN2::VARCHAR AS ASSET_TYPE,
           COLUMN3::VARCHAR AS PIT_NAME, COLUMN4::INTEGER AS ASSET_OFFSET
    FROM VALUES
        ('TRK-101', 'Haul Truck', 'Grasberg', 1),
        ('TRK-102', 'Haul Truck', 'Grasberg', 2),
        ('TRK-103', 'Haul Truck', 'Kucing Liar', 3),
        ('TRK-104', 'Haul Truck', 'Kucing Liar', 4),
        ('EXC-201', 'Excavator', 'Grasberg', 5),
        ('EXC-202', 'Excavator', 'Deep Mill Level Zone', 6),
        ('EXC-203', 'Excavator', 'Big Gossan', 7),
        ('DZR-301', 'Dozer', 'Grasberg', 8),
        ('DZR-302', 'Dozer', 'Kucing Liar', 9),
        ('LDR-401', 'Loader', 'Deep Mill Level Zone', 10),
        ('LDR-402', 'Loader', 'Big Gossan', 11),
        ('DRL-501', 'Drill', 'Grasberg', 12)
)
SELECT
    DATEADD('day', -d.DAY_OFFSET, CURRENT_DATE()),
    a.ASSET_ID,
    a.ASSET_TYPE,
    a.PIT_NAME,
    24.0,
    ROUND(24 * UPTIME_RATIO, 2),
    ROUND(UPTIME_RATIO * 100, 2),
    ROUND(780 * (0.75 + UPTIME_RATIO * 0.28), 2),
    CASE
        WHEN UPTIME_RATIO < 0.72 THEN 'Maintenance'
        WHEN UPTIME_RATIO < 0.85 THEN 'Monitoring'
        ELSE 'Normal'
    END
FROM (
    SELECT
        d.DAY_OFFSET,
        a.*,
        LEAST(
            0.99,
            GREATEST(
                0.68,
                0.86 + 0.035 * SIN((d.DAY_OFFSET + a.ASSET_OFFSET) / 5.0)
                - IFF(MOD(d.DAY_OFFSET * 3 + a.ASSET_OFFSET, 41) = 0, 0.20, 0)
            )
        ) AS UPTIME_RATIO
    FROM day_spine d
    CROSS JOIN assets a
);

INSERT INTO LOGISTICS_SHIPMENTS (
    SHIPMENT_ID,
    VESSEL_NAME,
    MINERAL,
    SOURCE_PIT,
    DESTINATION_PORT,
    DISPATCH_DATE,
    ETA_DATE,
    TONNES,
    READINESS_PCT,
    STATUS
)
WITH shipments AS (
    SELECT COLUMN1::INTEGER AS SHIPMENT_INDEX,
           COLUMN2::VARCHAR AS VESSEL_NAME,
           COLUMN3::VARCHAR AS MINERAL,
           COLUMN4::VARCHAR AS SOURCE_PIT,
           COLUMN5::VARCHAR AS DESTINATION_PORT,
           COLUMN6::NUMBER AS TONNES,
           COLUMN7::NUMBER AS READINESS_PCT,
           COLUMN8::VARCHAR AS STATUS
    FROM VALUES
        (1, 'MV Amamapare', 'Copper', 'Grasberg', 'Port Amamapare', 18500, 94, 'In Transit'),
        (2, 'MV Papua Star', 'Gold', 'Kucing Liar', 'Port Tanjung Priok', 20675, 83, 'Ready to Load'),
        (3, 'MV Nusantara Ore', 'Silver', 'Deep Mill Level Zone', 'Port Morowali', 22850, 88, 'At Port'),
        (4, 'MV Lontar Jaya', 'Copper', 'Big Gossan', 'Port Amamapare', 25025, 74, 'Documentation Hold'),
        (5, 'MV Timika Express', 'Gold', 'Grasberg', 'Port Tanjung Priok', 27200, 91, 'In Transit'),
        (6, 'MV Pacific Mineral', 'Silver', 'Kucing Liar', 'Port Morowali', 29375, 79, 'Ready to Load'),
        (7, 'MV Amamapare', 'Copper', 'Deep Mill Level Zone', 'Port Amamapare', 31550, 96, 'At Port'),
        (8, 'MV Papua Star', 'Gold', 'Big Gossan', 'Port Tanjung Priok', 33725, 72, 'Documentation Hold'),
        (9, 'MV Nusantara Ore', 'Silver', 'Grasberg', 'Port Morowali', 35900, 86, 'In Transit'),
        (10, 'MV Lontar Jaya', 'Copper', 'Kucing Liar', 'Port Amamapare', 38075, 90, 'Ready to Load'),
        (11, 'MV Timika Express', 'Gold', 'Deep Mill Level Zone', 'Port Tanjung Priok', 40250, 95, 'At Port'),
        (12, 'MV Pacific Mineral', 'Silver', 'Big Gossan', 'Port Morowali', 42425, 77, 'In Transit')
)
SELECT
    'SHP-' || TO_VARCHAR(CURRENT_DATE(), 'YYMM') || '-' || LPAD(SHIPMENT_INDEX::VARCHAR, 3, '0'),
    VESSEL_NAME,
    MINERAL,
    SOURCE_PIT,
    DESTINATION_PORT,
    DATEADD('day', -(11 - MOD(SHIPMENT_INDEX, 9)), CURRENT_DATE()),
    DATEADD(
        'day',
        -(11 - MOD(SHIPMENT_INDEX, 9)) + 3 + MOD(SHIPMENT_INDEX, 6),
        CURRENT_DATE()
    ),
    TONNES,
    READINESS_PCT,
    STATUS
FROM shipments;
