-- Performance indexes for GHGConnect
-- These will be created after the tables are created by Drizzle

-- This file serves as documentation for indexes that should be created
-- Run this after: npm run db:push

-- User indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON ghgconnect.users(email);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON ghgconnect.users(username);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_id ON ghgconnect.users(tenant_id);

-- Vessel indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_tenant_id ON ghgconnect.vessels(tenant_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_fleet_id ON ghgconnect.vessels(fleet_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_imo_number ON ghgconnect.vessels(imo_number);

-- Voyage indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_tenant_id ON ghgconnect.voyages(tenant_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_vessel_id ON ghgconnect.voyages(vessel_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_departure_at ON ghgconnect.voyages(departure_at);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_arrival_at ON ghgconnect.voyages(arrival_at);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_status ON ghgconnect.voyages(status);

-- Consumption indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumptions_voyage_id ON ghgconnect.consumptions(voyage_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumptions_fuel_id ON ghgconnect.consumptions(fuel_id);

-- Port indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_unlocode ON ghgconnect.ports(unlocode);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_country_iso ON ghgconnect.ports(country_iso);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_is_eu ON ghgconnect.ports(is_eu) WHERE is_eu = true;
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_is_uk ON ghgconnect.ports(is_uk) WHERE is_uk = true;

-- Fuel indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuels_code ON ghgconnect.fuels(code);

-- Audit log indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_id ON ghgconnect.audit_logs(tenant_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON ghgconnect.audit_logs(user_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity ON ghgconnect.audit_logs(entity_type, entity_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp ON ghgconnect.audit_logs(timestamp DESC);

-- Full-text search indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_name_trgm ON ghgconnect.vessels USING gin(name gin_trgm_ops);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_name_trgm ON ghgconnect.ports USING gin(name gin_trgm_ops);

-- Composite indexes for common queries
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_vessel_date ON ghgconnect.voyages(vessel_id, departure_at DESC);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_tenant_date ON ghgconnect.voyages(tenant_id, departure_at DESC);

COMMENT ON SCHEMA ghgconnect IS 'Indexes are created by migrations after schema is set up';

