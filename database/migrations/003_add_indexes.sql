-- ===================================================================
-- Performance Optimization: Database Indexes
-- ===================================================================
-- Migration: 003_add_indexes
-- Created: 2025-10-21
-- Description: Add indexes for common query patterns to improve performance
-- ===================================================================

-- Tenants indexes
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at DESC);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_organizations_parent_org_id ON organizations(parent_org_id) WHERE parent_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);

-- Fleets indexes
CREATE INDEX IF NOT EXISTS idx_fleets_org_id ON fleets(org_id);
CREATE INDEX IF NOT EXISTS idx_fleets_tenant_id ON fleets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fleets_org_tenant ON fleets(org_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_fleets_created_at ON fleets(created_at DESC);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- User Roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant ON user_roles(user_id, tenant_id);

-- Audit Logs indexes (for querying and cleanup)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);

-- Ports indexes
CREATE INDEX IF NOT EXISTS idx_ports_unlocode ON ports(unlocode);
CREATE INDEX IF NOT EXISTS idx_ports_country_iso ON ports(country_iso);
CREATE INDEX IF NOT EXISTS idx_ports_is_eu ON ports(is_eu) WHERE is_eu = TRUE;
CREATE INDEX IF NOT EXISTS idx_ports_is_uk ON ports(is_uk) WHERE is_uk = TRUE;
CREATE INDEX IF NOT EXISTS idx_ports_is_omr ON ports(is_omr) WHERE is_omr = TRUE;
CREATE INDEX IF NOT EXISTS idx_ports_location ON ports USING GIST (ll_to_earth(latitude::double precision, longitude::double precision))
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Vessels indexes (critical for performance)
CREATE INDEX IF NOT EXISTS idx_vessels_tenant_id ON vessels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vessels_fleet_id ON vessels(fleet_id) WHERE fleet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vessels_imo_number ON vessels(imo_number);
CREATE INDEX IF NOT EXISTS idx_vessels_tenant_fleet ON vessels(tenant_id, fleet_id);
CREATE INDEX IF NOT EXISTS idx_vessels_vessel_type ON vessels(vessel_type);
CREATE INDEX IF NOT EXISTS idx_vessels_flag_state ON vessels(flag_state);
CREATE INDEX IF NOT EXISTS idx_vessels_created_at ON vessels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vessels_updated_at ON vessels(updated_at DESC);

-- Fuels indexes
CREATE INDEX IF NOT EXISTS idx_fuels_code ON fuels(code);

-- Voyages indexes (very important for queries)
CREATE INDEX IF NOT EXISTS idx_voyages_tenant_id ON voyages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_voyages_vessel_id ON voyages(vessel_id);
CREATE INDEX IF NOT EXISTS idx_voyages_departure_port ON voyages(departure_port_id);
CREATE INDEX IF NOT EXISTS idx_voyages_arrival_port ON voyages(arrival_port_id);
CREATE INDEX IF NOT EXISTS idx_voyages_departure_at ON voyages(departure_at DESC);
CREATE INDEX IF NOT EXISTS idx_voyages_arrival_at ON voyages(arrival_at DESC);
CREATE INDEX IF NOT EXISTS idx_voyages_voyage_type ON voyages(voyage_type);
CREATE INDEX IF NOT EXISTS idx_voyages_status ON voyages(status);
CREATE INDEX IF NOT EXISTS idx_voyages_tenant_vessel ON voyages(tenant_id, vessel_id);
CREATE INDEX IF NOT EXISTS idx_voyages_vessel_departure ON voyages(vessel_id, departure_at DESC);
CREATE INDEX IF NOT EXISTS idx_voyages_created_at ON voyages(created_at DESC);

-- Consumptions indexes
CREATE INDEX IF NOT EXISTS idx_consumptions_voyage_id ON consumptions(voyage_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_fuel_id ON consumptions(fuel_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_location ON consumptions(location);
CREATE INDEX IF NOT EXISTS idx_consumptions_voyage_fuel ON consumptions(voyage_id, fuel_id);

-- BDNs (Bunker Delivery Notes) indexes
CREATE INDEX IF NOT EXISTS idx_bdns_tenant_id ON bdns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bdns_vessel_id ON bdns(vessel_id);
CREATE INDEX IF NOT EXISTS idx_bdns_fuel_id ON bdns(fuel_id);
CREATE INDEX IF NOT EXISTS idx_bdns_delivery_date ON bdns(delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_bdns_verified ON bdns(verified);
CREATE INDEX IF NOT EXISTS idx_bdns_vessel_delivery ON bdns(vessel_id, delivery_date DESC);

-- OPS Sessions indexes
CREATE INDEX IF NOT EXISTS idx_ops_sessions_tenant_id ON ops_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ops_sessions_vessel_id ON ops_sessions(vessel_id);
CREATE INDEX IF NOT EXISTS idx_ops_sessions_port_id ON ops_sessions(port_id);
CREATE INDEX IF NOT EXISTS idx_ops_sessions_session_date ON ops_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_ops_sessions_vessel_date ON ops_sessions(vessel_id, session_date DESC);

-- User Preferences indexes (if table exists)
-- CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Fleet Access indexes (if table exists for user access control)
-- CREATE INDEX IF NOT EXISTS idx_fleet_access_user_id ON fleet_access(user_id);
-- CREATE INDEX IF NOT EXISTS idx_fleet_access_fleet_id ON fleet_access(fleet_id);
-- CREATE INDEX IF NOT EXISTS idx_fleet_access_expires_at ON fleet_access(expires_at) WHERE expires_at IS NOT NULL;

-- Vessel Access indexes (if table exists for user access control)
-- CREATE INDEX IF NOT EXISTS idx_vessel_access_user_id ON vessel_access(user_id);
-- CREATE INDEX IF NOT EXISTS idx_vessel_access_vessel_id ON vessel_access(vessel_id);
-- CREATE INDEX IF NOT EXISTS idx_vessel_access_expires_at ON vessel_access(expires_at) WHERE expires_at IS NOT NULL;

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_voyages_tenant_departure_range ON voyages(tenant_id, departure_at DESC, arrival_at DESC);
CREATE INDEX IF NOT EXISTS idx_vessels_tenant_type_flag ON vessels(tenant_id, vessel_type, flag_state);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_entity_time ON audit_logs(tenant_id, entity_type, timestamp DESC);

-- Partial indexes for common filters
CREATE INDEX IF NOT EXISTS idx_voyages_pending ON voyages(tenant_id, vessel_id, departure_at DESC) 
  WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_voyages_completed ON voyages(tenant_id, vessel_id, departure_at DESC) 
  WHERE status = 'COMPLETED';
CREATE INDEX IF NOT EXISTS idx_users_active ON users(tenant_id, email) 
  WHERE last_login IS NOT NULL;

-- ===================================================================
-- Index Statistics and Maintenance
-- ===================================================================

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- To analyze tables after index creation:
-- ANALYZE tenants;
-- ANALYZE organizations;
-- ANALYZE fleets;
-- ANALYZE users;
-- ANALYZE user_roles;
-- ANALYZE audit_logs;
-- ANALYZE ports;
-- ANALYZE vessels;
-- ANALYZE fuels;
-- ANALYZE voyages;
-- ANALYZE consumptions;
-- ANALYZE bdns;
-- ANALYZE ops_sessions;

-- To check table sizes:
-- SELECT
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ===================================================================
-- Notes:
-- - Indexes improve read performance but add overhead to writes
-- - Monitor index usage and remove unused indexes
-- - Regularly run VACUUM and ANALYZE
-- - Consider BRIN indexes for very large time-series tables
-- ===================================================================

