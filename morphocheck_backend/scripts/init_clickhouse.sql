-- ============================================================
-- MorphoCheck — ClickHouse Analytics Tables
-- OLAP engine: katta hajmli analytics so'rovlari uchun
-- ============================================================

-- Analytics uchun alohida database
CREATE DATABASE IF NOT EXISTS morphocheck_analytics;

-- ============================================================
-- 1. TAHLIL HODISALARI (patient_analysis mirror)
-- PostgreSQL dan bu jadvalga ma'lumot sinxronlanadi
-- ============================================================
CREATE TABLE IF NOT EXISTS morphocheck_analytics.patient_analysis_events (
    id          UInt64,
    created_at  DateTime,
    gender      LowCardinality(String),
    age         UInt8,
    age_months  Nullable(UInt8),
    height      Float32,
    weight      Float32,
    bmi         Float32,
    z_score     Float32,
    somatotype  LowCardinality(String),
    region      LowCardinality(String),
    district    LowCardinality(String),
    is_deleted  UInt8 DEFAULT 0,
    created_by_id Nullable(UInt32),
    -- Bioimpedance
    fat_percent  Nullable(Float32),
    muscle_mass  Nullable(Float32),
    fat_mass     Nullable(Float32),
    bone_mass    Nullable(Float32)
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(created_at)
ORDER BY (region, gender, age, id)
SETTINGS index_granularity = 8192;

-- ============================================================
-- 2. TADQIQOT HODISALARI (research_records mirror)
-- ============================================================
CREATE TABLE IF NOT EXISTS morphocheck_analytics.research_events (
    id           UInt64,
    created_at   DateTime,
    gender       LowCardinality(String),
    birth_date   Nullable(String),
    region       LowCardinality(String) DEFAULT '',
    feeding_type LowCardinality(String) DEFAULT '',
    parents_marriage LowCardinality(String) DEFAULT '',
    is_deleted   UInt8 DEFAULT 0,
    created_by_id Nullable(UInt32)
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(created_at)
ORDER BY (gender, id)
SETTINGS index_granularity = 8192;

-- ============================================================
-- 3. FOYDALANUVCHI FAOLIYATI LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS morphocheck_analytics.user_activity (
    id           UInt64,
    user_id      UInt32,
    action       LowCardinality(String),
    target_type  LowCardinality(String),
    target_id    Nullable(UInt32),
    ip_address   Nullable(String),
    created_at   DateTime
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (user_id, created_at, id)
TTL created_at + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;

-- ============================================================
-- 4. REAL-TIME MATERIALIZED VIEW — Kunlik BMI statistika
-- ============================================================
CREATE TABLE IF NOT EXISTS morphocheck_analytics.daily_bmi_stats_mv_target (
    day          Date,
    gender       LowCardinality(String),
    region       LowCardinality(String),
    total        UInt64,
    avg_bmi      Float32,
    avg_age      Float32,
    avg_height   Float32,
    avg_weight   Float32,
    underweight  UInt32,
    normal       UInt32,
    overweight   UInt32,
    obese        UInt32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (day, gender, region);

CREATE MATERIALIZED VIEW IF NOT EXISTS morphocheck_analytics.daily_bmi_stats_mv
TO morphocheck_analytics.daily_bmi_stats_mv_target
AS SELECT
    toDate(created_at)    AS day,
    gender,
    region,
    count()               AS total,
    avg(bmi)              AS avg_bmi,
    avg(age)              AS avg_age,
    avg(height)           AS avg_height,
    avg(weight)           AS avg_weight,
    countIf(bmi < 18.5)   AS underweight,
    countIf(bmi >= 18.5 AND bmi < 25) AS normal,
    countIf(bmi >= 25 AND bmi < 30)   AS overweight,
    countIf(bmi >= 30)    AS obese
FROM morphocheck_analytics.patient_analysis_events
WHERE is_deleted = 0
GROUP BY day, gender, region;

-- ============================================================
-- 5. SOMATOTIP TAQSIMOTI VIEW
-- ============================================================
CREATE TABLE IF NOT EXISTS morphocheck_analytics.somatotype_dist_mv_target (
    month      Date,
    somatotype LowCardinality(String),
    gender     LowCardinality(String),
    region     LowCardinality(String),
    count      UInt64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(month)
ORDER BY (month, somatotype, gender, region);

CREATE MATERIALIZED VIEW IF NOT EXISTS morphocheck_analytics.somatotype_dist_mv
TO morphocheck_analytics.somatotype_dist_mv_target
AS SELECT
    toStartOfMonth(created_at) AS month,
    somatotype,
    gender,
    region,
    count() AS count
FROM morphocheck_analytics.patient_analysis_events
WHERE is_deleted = 0
GROUP BY month, somatotype, gender, region;
