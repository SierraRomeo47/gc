-- Performance indexes for GHGConnect
-- Run this after: npm run db:push
-- Usage: psql -U ghgconnect_user -d ghgconnect_db -f database/migrations/create_indexes.sql

\echo 'Creating performance indexes...'

-- User indexes for authentication and lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- User roles for RBAC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_composite ON user_roles(user_id, tenant_id);

-- Tenant indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_name ON tenants(name);

-- Organization hierarchy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_parent ON organizations(parent_org_id);

-- Fleet management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fleets_org_id ON fleets(org_id);

-- Vessel indexes - critical for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_tenant_id ON vessels(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_fleet_id ON vessels(fleet_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_imo_number ON vessels(imo_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_name ON vessels(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_type ON vessels(vessel_type);

-- Voyage indexes - most queried table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_tenant_id ON voyages(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_vessel_id ON voyages(vessel_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_departure_at ON voyages(departure_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_arrival_at ON voyages(arrival_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_status ON voyages(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_departure_port ON voyages(departure_port_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_arrival_port ON voyages(arrival_port_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_type ON voyages(voyage_type);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_vessel_date ON voyages(vessel_id, departure_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_tenant_date ON voyages(tenant_id, departure_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyages_tenant_vessel ON voyages(tenant_id, vessel_id);

-- Consumption indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumptions_voyage_id ON consumptions(voyage_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumptions_fuel_id ON consumptions(fuel_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumptions_location ON consumptions(location);

-- Port indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_unlocode ON ports(unlocode);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_country_iso ON ports(country_iso);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_is_eu ON ports(is_eu) WHERE is_eu = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_is_uk ON ports(is_uk) WHERE is_uk = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_name ON ports(name);

-- Fuel indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuels_code ON fuels(code);

-- BDN (Bunker Delivery Notes) indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bdns_tenant_id ON bdns(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bdns_vessel_id ON bdns(vessel_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bdns_fuel_id ON bdns(fuel_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bdns_delivery_date ON bdns(delivery_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bdns_verified ON bdns(verified);

-- OPS Session indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_sessions_tenant_id ON ops_sessions(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_sessions_vessel_id ON ops_sessions(vessel_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_sessions_port_id ON ops_sessions(port_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ops_sessions_date ON ops_sessions(session_date DESC);

-- Voyage segments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyage_segments_voyage_id ON voyage_segments(voyage_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voyage_segments_order ON voyage_segments(voyage_id, segment_order);

-- Regulatory constants
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_regulatory_constants_framework ON regulatory_constants(framework);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_regulatory_constants_key ON regulatory_constants(constant_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_regulatory_constants_effective ON regulatory_constants(framework, effective_from, effective_to);

-- Calculation formulas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calc_formulas_framework ON calculation_formulas(framework);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calc_formulas_key ON calculation_formulas(formula_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calc_formulas_effective ON calculation_formulas(framework, effective_from, effective_to);

-- Calc runs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calc_runs_tenant_id ON calc_runs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calc_runs_started_at ON calc_runs(started_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calc_runs_status ON calc_runs(status);

-- Scenarios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_tenant_id ON scenarios(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_created_by ON scenarios(created_by);

-- Scenario results
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenario_results_scenario_id ON scenario_results(scenario_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenario_results_framework ON scenario_results(framework, year);

-- Audit log indexes - critical for compliance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_composite ON audit_logs(tenant_id, timestamp DESC);

-- Full-text search indexes using pg_trgm
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vessels_name_trgm ON vessels USING gin(name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ports_name_trgm ON ports USING gin(name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_name_trgm ON organizations USING gin(name gin_trgm_ops);

\echo 'Indexes created successfully!'
\echo 'Run ANALYZE to update statistics:'
\echo 'ANALYZE VERBOSE;'

