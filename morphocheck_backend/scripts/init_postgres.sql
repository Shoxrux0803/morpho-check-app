-- ============================================================
-- MorphoCheck PostgreSQL Initialization Script
-- Bu fayl PostgreSQL konteyner birinchi marta ishga tushganda
-- avtomatik bajariladi.
-- ============================================================

-- UUID extension (keyinchalik kerak bo'lishi mumkin)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector extension (3-bosqich: AI/recommendation uchun)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Encoding va locale sozlamalari (container yaratilganda belgilanadi)
-- SHOW server_encoding;

-- Foydalanuvchi huquqlari
GRANT ALL PRIVILEGES ON DATABASE morphocheck TO morpho;
