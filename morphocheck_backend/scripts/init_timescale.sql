-- ============================================================
-- MorphoCheck — TimescaleDB Initialization
-- Bu fayl Docker konteyner birinchi marta ishga tushganda
-- 01_init.sql dan keyin bajariladi.
-- ============================================================

-- TimescaleDB extension ni yoqish
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- pgvector extension (3-bosqich uchun tayyor)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- HYPERTABLE YARATISH
-- patient_analysis va research_records jadvallarini
-- vaqt seriyali (time-series) jadvalga aylantirish.
-- Bu jadvallar SQLAlchemy tomonidan allaqachon yaratiladi,
-- shuning uchun bu skript startup da qayta bajarilganda
-- IF NOT EXISTS bilan xavfsiz ishlaydi.
-- ============================================================

-- Bu funksiya jadval allaqachon mavjud bo'lsa ham xavfsiz ishlaydi
DO $$
BEGIN
    -- patient_analysis uchun hypertable
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'patient_analysis'
    ) THEN
        BEGIN
            PERFORM create_hypertable(
                'patient_analysis',
                'created_at',
                if_not_exists => TRUE,
                migrate_data => TRUE
            );
            RAISE NOTICE 'patient_analysis hypertable yaratildi yoki allaqachon mavjud';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'patient_analysis hypertable: %', SQLERRM;
        END;
    END IF;

    -- research_records uchun hypertable
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'research_records'
    ) THEN
        BEGIN
            PERFORM create_hypertable(
                'research_records',
                'created_at',
                if_not_exists => TRUE,
                migrate_data => TRUE
            );
            RAISE NOTICE 'research_records hypertable yaratildi yoki allaqachon mavjud';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'research_records hypertable: %', SQLERRM;
        END;
    END IF;

    -- audit_logs uchun hypertable (log ma'lumotlar uchun ideal)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
    ) THEN
        BEGIN
            PERFORM create_hypertable(
                'audit_logs',
                'created_at',
                if_not_exists => TRUE,
                migrate_data => TRUE
            );
            RAISE NOTICE 'audit_logs hypertable yaratildi yoki allaqachon mavjud';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'audit_logs hypertable: %', SQLERRM;
        END;
    END IF;
END $$;

-- ============================================================
-- TimescaleDB KOMPRESSIYA (6 oydan eski ma'lumotlarni siqish)
-- Production uchun tejamkor saqlash
-- ============================================================

-- patient_analysis uchun kompressiya
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'patient_analysis'
    ) THEN
        BEGIN
            ALTER TABLE patient_analysis SET (
                timescaledb.compress,
                timescaledb.compress_orderby = 'created_at DESC',
                timescaledb.compress_segmentby = 'gender, region'
            );
            SELECT add_compression_policy('patient_analysis', INTERVAL '6 months', if_not_exists => TRUE);
            RAISE NOTICE 'patient_analysis compression policy qo''shildi';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'patient_analysis compression: %', SQLERRM;
        END;
    END IF;
END $$;

-- ============================================================
-- CONTINUOUS AGGREGATE — Real-time statistika materiallashtirilgan ko'rinishlar
-- Bu ko'rinishlar analytics dashboard uchun juda tez ishlaydi
-- ============================================================

-- Kunlik analiz statistikasi
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analysis_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', created_at) AS bucket,
    COUNT(*) AS total_count,
    AVG(bmi) AS avg_bmi,
    AVG(age) AS avg_age,
    AVG(height) AS avg_height,
    AVG(weight) AS avg_weight,
    COUNT(CASE WHEN gender = 'erkak' THEN 1 END) AS male_count,
    COUNT(CASE WHEN gender = 'ayol' THEN 1 END) AS female_count,
    COUNT(CASE WHEN is_deleted = 0 THEN 1 END) AS active_count
FROM patient_analysis
GROUP BY bucket
WITH NO DATA;

-- Haftalik region statistikasi
CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_region_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('7 days', created_at) AS bucket,
    region,
    COUNT(*) AS count,
    AVG(bmi) AS avg_bmi,
    AVG(z_score) AS avg_z_score
FROM patient_analysis
WHERE is_deleted = 0
GROUP BY bucket, region
WITH NO DATA;

-- Continuous aggregate refresh policy
SELECT add_continuous_aggregate_policy('daily_analysis_stats',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('weekly_region_stats',
    start_offset => INTERVAL '14 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- ============================================================
-- RETENTION POLICY — Eski audit loglarni avtomatik o'chirish
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'audit_logs'
    ) THEN
        BEGIN
            SELECT add_retention_policy('audit_logs', INTERVAL '2 years', if_not_exists => TRUE);
            RAISE NOTICE 'audit_logs retention policy 2 yil qo''shildi';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'audit_logs retention: %', SQLERRM;
        END;
    END IF;
END $$;
