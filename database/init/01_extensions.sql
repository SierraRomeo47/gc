-- Enable required PostgreSQL extensions
-- This file runs automatically when the database is first created

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Geographic data (if needed for port coordinates)
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA public;

-- Performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schema for better organization
CREATE SCHEMA IF NOT EXISTS ghgconnect;

-- Set search path
ALTER DATABASE ghgconnect_db SET search_path TO ghgconnect, public;

COMMENT ON SCHEMA ghgconnect IS 'Main application schema for GHGConnect';

