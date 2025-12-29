-- ============================================================
-- GHGConnect Maritime Compliance Platform
-- Complete Database Build Script
-- ============================================================
-- This script creates the complete database structure and
-- populates it with realistic maritime compliance data
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS scenario_results CASCADE;
DROP TABLE IF EXISTS scenarios CASCADE;
DROP TABLE IF EXISTS calc_runs CASCADE;
DROP TABLE IF EXISTS calculation_formulas CASCADE;
DROP TABLE IF EXISTS regulatory_constants CASCADE;
DROP TABLE IF EXISTS voyage_segments CASCADE;
DROP TABLE IF EXISTS ops_sessions CASCADE;
DROP TABLE IF EXISTS bdns CASCADE;
DROP TABLE IF EXISTS consumptions CASCADE;
DROP TABLE IF EXISTS voyages CASCADE;
DROP TABLE IF EXISTS vessels CASCADE;
DROP TABLE IF EXISTS ports CASCADE;
DROP TABLE IF EXISTS fuels CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS fleets CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS role CASCADE;
DROP TYPE IF EXISTS framework CASCADE;
DROP TYPE IF EXISTS voyage_type CASCADE;
DROP TYPE IF EXISTS location CASCADE;
DROP TYPE IF EXISTS run_type CASCADE;
DROP TYPE IF EXISTS status CASCADE;

-- Create enums
CREATE TYPE role AS ENUM (
  'OWNER',
  'ADMIN',
  'COMPLIANCE',
  'DATA_ENGINEER',
  'OPS',
  'FINANCE',
  'VERIFIER_RO'
);

CREATE TYPE framework AS ENUM (
  'FUELEU',
  'EU_ETS',
  'IMO',
  'UK_ETS'
);

CREATE TYPE voyage_type AS ENUM (
  'INTRA_EU',
  'EXTRA_EU',
  'UK_DOMESTIC',
  'OTHER'
);

CREATE TYPE location AS ENUM (
  'AT_SEA',
  'AT_BERTH',
  'MANEUVERING'
);

CREATE TYPE run_type AS ENUM (
  'STANDARD',
  'SCENARIO'
);

CREATE TYPE status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'ERROR'
);

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Tenants table
CREATE TABLE tenants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  settings_json JSONB
);

-- Organizations table
CREATE TABLE organizations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  parent_org_id VARCHAR REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Fleets table
CREATE TABLE fleets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id VARCHAR NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Users table
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR REFERENCES tenants(id),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  mfa_secret TEXT,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User roles table
CREATE TABLE user_roles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  role role NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Audit logs table
CREATE TABLE audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  user_id VARCHAR REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id VARCHAR,
  action TEXT NOT NULL,
  old_value_json JSONB,
  new_value_json JSONB,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  request_id VARCHAR
);

-- ============================================================
-- MARITIME ENTITIES
-- ============================================================

-- Ports table
CREATE TABLE ports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR REFERENCES tenants(id),
  unlocode VARCHAR(10) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_iso VARCHAR(2) NOT NULL,
  is_eu BOOLEAN DEFAULT FALSE NOT NULL,
  is_uk BOOLEAN DEFAULT FALSE NOT NULL,
  is_omr BOOLEAN DEFAULT FALSE NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Fuels table
CREATE TABLE fuels (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code VARCHAR(20) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  lcv_mj_kg DECIMAL(10,4) NOT NULL,
  default_ttw_gco2e_mj DECIMAL(10,4) NOT NULL,
  default_wtt_gco2e_mj DECIMAL(10,4) NOT NULL,
  default_co2_factor_t DECIMAL(10,4) NOT NULL
);

-- Vessels table
CREATE TABLE vessels (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  fleet_id VARCHAR REFERENCES fleets(id),
  imo_number VARCHAR(20) NOT NULL,
  name TEXT NOT NULL,
  vessel_type TEXT NOT NULL,
  flag_state VARCHAR(2) NOT NULL,
  gross_tonnage INTEGER NOT NULL,
  deadweight_tonnage INTEGER,
  main_engine_type TEXT,
  ice_class TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Voyages table
CREATE TABLE voyages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  vessel_id VARCHAR NOT NULL REFERENCES vessels(id),
  voyage_number TEXT NOT NULL,
  departure_port_id VARCHAR NOT NULL REFERENCES ports(id),
  arrival_port_id VARCHAR NOT NULL REFERENCES ports(id),
  departure_at TIMESTAMP NOT NULL,
  arrival_at TIMESTAMP NOT NULL,
  distance_nm DECIMAL(10,2) NOT NULL,
  voyage_type voyage_type NOT NULL,
  coverage_eu_pct DECIMAL(3,2) NOT NULL,
  coverage_uk_pct DECIMAL(3,2) NOT NULL,
  status status DEFAULT 'PENDING' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Consumptions table
CREATE TABLE consumptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  voyage_id VARCHAR NOT NULL REFERENCES voyages(id),
  fuel_id VARCHAR NOT NULL REFERENCES fuels(id),
  mass_tonnes DECIMAL(10,4) NOT NULL,
  engine_type TEXT,
  methane_slip_pct DECIMAL(5,2),
  location location NOT NULL
);

-- BDN (Bunker Delivery Note) table
CREATE TABLE bdns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  vessel_id VARCHAR NOT NULL REFERENCES vessels(id),
  fuel_id VARCHAR NOT NULL REFERENCES fuels(id),
  supplier_name TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  delivery_date TIMESTAMP NOT NULL,
  delivered_mass_tonnes DECIMAL(10,4) NOT NULL,
  lcv_mj_kg_actual DECIMAL(10,4),
  wtt_source TEXT,
  wtt_gco2e_mj_actual DECIMAL(10,4),
  document_url TEXT,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- OPS (Onshore Power Supply) Sessions table
CREATE TABLE ops_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  vessel_id VARCHAR NOT NULL REFERENCES vessels(id),
  port_id VARCHAR NOT NULL REFERENCES ports(id),
  session_date TIMESTAMP NOT NULL,
  kwh_supplied DECIMAL(10,2) NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  is_mandatory_port BOOLEAN DEFAULT FALSE NOT NULL,
  verified BOOLEAN DEFAULT FALSE NOT NULL
);

-- Voyage segments table
CREATE TABLE voyage_segments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  voyage_id VARCHAR NOT NULL REFERENCES voyages(id),
  segment_order INTEGER NOT NULL,
  start_port_id VARCHAR NOT NULL REFERENCES ports(id),
  end_port_id VARCHAR NOT NULL REFERENCES ports(id),
  is_eu_waters BOOLEAN DEFAULT FALSE NOT NULL,
  coverage_coefficient DECIMAL(3,2) NOT NULL,
  distance_nm DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- REGULATORY AND CALCULATION TABLES
-- ============================================================

-- Regulatory constants table
CREATE TABLE regulatory_constants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  constant_key TEXT NOT NULL,
  framework framework NOT NULL,
  value_json JSONB NOT NULL,
  effective_from TIMESTAMP NOT NULL,
  effective_to TIMESTAMP,
  version TEXT NOT NULL,
  source_regulation TEXT,
  source_url TEXT,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Calculation formulas table
CREATE TABLE calculation_formulas (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  formula_key TEXT NOT NULL,
  framework framework NOT NULL,
  formula_expression TEXT NOT NULL,
  description TEXT,
  variables_schema_json JSONB,
  locked BOOLEAN DEFAULT FALSE NOT NULL,
  version TEXT NOT NULL,
  effective_from TIMESTAMP NOT NULL,
  effective_to TIMESTAMP,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Calculation runs table
CREATE TABLE calc_runs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  run_type run_type NOT NULL,
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  constants_version_id VARCHAR,
  formulas_version_id VARCHAR,
  input_hash TEXT NOT NULL,
  output_summary_json JSONB,
  status status DEFAULT 'PENDING' NOT NULL,
  error_message TEXT
);

-- Scenarios table
CREATE TABLE scenarios (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  baseline_calc_run_id VARCHAR REFERENCES calc_runs(id),
  params_json JSONB NOT NULL,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Scenario results table
CREATE TABLE scenario_results (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scenario_id VARCHAR NOT NULL REFERENCES scenarios(id),
  framework framework NOT NULL,
  year INTEGER NOT NULL,
  allowances_required DECIMAL(15,4),
  penalties DECIMAL(15,2),
  cost_estimate DECIMAL(15,2),
  delta_vs_baseline DECIMAL(15,2)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Tenant-based indexes for multi-tenancy
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_fleets_org_id ON fleets(org_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_vessels_tenant_id ON vessels(tenant_id);
CREATE INDEX idx_voyages_tenant_id ON voyages(tenant_id);
CREATE INDEX idx_bdns_tenant_id ON bdns(tenant_id);
CREATE INDEX idx_ops_sessions_tenant_id ON ops_sessions(tenant_id);
CREATE INDEX idx_calc_runs_tenant_id ON calc_runs(tenant_id);
CREATE INDEX idx_scenarios_tenant_id ON scenarios(tenant_id);

-- Maritime entity indexes
CREATE INDEX idx_ports_unlocode ON ports(unlocode);
CREATE INDEX idx_ports_country ON ports(country_iso);
CREATE INDEX idx_ports_eu_uk ON ports(is_eu, is_uk);
CREATE INDEX idx_vessels_imo ON vessels(imo_number);
CREATE INDEX idx_vessels_fleet ON vessels(fleet_id);
CREATE INDEX idx_voyages_vessel ON voyages(vessel_id);
CREATE INDEX idx_voyages_departure ON voyages(departure_port_id);
CREATE INDEX idx_voyages_arrival ON voyages(arrival_port_id);
CREATE INDEX idx_voyages_dates ON voyages(departure_at, arrival_at);
CREATE INDEX idx_consumptions_voyage ON consumptions(voyage_id);
CREATE INDEX idx_consumptions_fuel ON consumptions(fuel_id);

-- Regulatory indexes
CREATE INDEX idx_regulatory_constants_framework
  ON regulatory_constants(framework);

CREATE INDEX idx_regulatory_constants_effective
  ON regulatory_constants(effective_from, effective_to);

CREATE INDEX idx_calculation_formulas_framework
  ON calculation_formulas(framework);

CREATE INDEX idx_calculation_formulas_effective
  ON calculation_formulas(effective_from, effective_to);


-- ============================================================
-- SAMPLE DATA INSERTION
-- ============================================================

-- Insert sample tenant
INSERT INTO tenants (id, name, settings_json) VALUES 
('tenant-001', 'Maritime Compliance Solutions Ltd', '{"timezone": "UTC", "currency": "EUR", "defaultFramework": "FUELEU"}');

-- Insert sample organization
INSERT INTO organizations (id, tenant_id, name) VALUES 
('org-001', 'tenant-001', 'Maritime Solutions Fleet Management');

-- Insert sample fleet
INSERT INTO fleets (id, org_id, name, description) VALUES 
('fleet-001', 'org-001', 'European Coastal Fleet', 'Fleet operating in EU waters for coastal trading');

-- Insert sample users
INSERT INTO users (id, tenant_id, username, email, password) VALUES 
('user-001', 'tenant-001', 'admin', 'admin@maritime-solutions.com', crypt('admin123', gen_salt('bf'))),
('user-002', 'tenant-001', 'compliance', 'compliance@maritime-solutions.com', crypt('compliance123', gen_salt('bf'))),
('user-003', 'tenant-001', 'ops', 'ops@maritime-solutions.com', crypt('ops123', gen_salt('bf')));

-- Insert user roles
INSERT INTO user_roles (user_id, tenant_id, role) VALUES 
('user-001', 'tenant-001', 'OWNER'),
('user-002', 'tenant-001', 'COMPLIANCE'),
('user-003', 'tenant-001', 'OPS');

-- Insert comprehensive ports data
INSERT INTO ports (id, unlocode, name, country_iso, is_eu, is_uk, is_omr, latitude, longitude) VALUES 
-- EU Ports
('port-001', 'NLRTM', 'Rotterdam', 'NL', true, false, false, 51.9225, 4.4792),
('port-002', 'DEHAM', 'Hamburg', 'DE', true, false, false, 53.5511, 9.9937),
('port-003', 'BEANR', 'Antwerp', 'BE', true, false, false, 51.2194, 4.4025),
('port-004', 'FRLEH', 'Le Havre', 'FR', true, false, false, 49.4944, 0.1072),
('port-005', 'ITGOA', 'Genoa', 'IT', true, false, false, 44.4056, 8.9463),
('port-006', 'ESBCN', 'Barcelona', 'ES', true, false, false, 41.3851, 2.1734),
('port-007', 'GRSKG', 'Thessaloniki', 'GR', true, false, false, 40.6401, 22.9444),
('port-008', 'PLGDN', 'Gdansk', 'PL', true, false, false, 54.3520, 18.6466),
('port-009', 'FIHEL', 'Helsinki', 'FI', true, false, false, 60.1699, 24.9384),
('port-010', 'SEGOT', 'Gothenburg', 'SE', true, false, false, 57.7089, 11.9746),
('port-011', 'DKCPH', 'Copenhagen', 'DK', true, false, false, 55.6761, 12.5683),
('port-012', 'NOOSL', 'Oslo', 'NO', false, false, false, 59.9139, 10.7522),
('port-013', 'IEORK', 'Cork', 'IE', true, false, false, 51.8985, -8.4756),
('port-014', 'PTLIS', 'Lisbon', 'PT', true, false, false, 38.7223, -9.1393),
('port-015', 'GRPIR', 'Piraeus', 'GR', true, false, false, 37.9755, 23.7348),

-- UK Ports
('port-016', 'GBLGP', 'London Gateway', 'GB', false, true, false, 51.5007, 0.1246),
('port-017', 'GBFXT', 'Felixstowe', 'GB', false, true, false, 51.9560, 1.3572),
('port-018', 'GBSOU', 'Southampton', 'GB', false, true, false, 50.9097, -1.4044),
('port-019', 'GBLIV', 'Liverpool', 'GB', false, true, false, 53.4084, -2.9916),
('port-020', 'GBABR', 'Aberdeen', 'GB', false, true, false, 57.1497, -2.0943),

-- International Ports
('port-021', 'USNYC', 'New York', 'US', false, false, false, 40.7128, -74.0060),
('port-022', 'CNQIN', 'Qingdao', 'CN', false, false, false, 36.0986, 120.3719),
('port-023', 'SGSNG', 'Singapore', 'SG', false, false, false, 1.2966, 103.7764),
('port-024', 'JPTYO', 'Tokyo', 'JP', false, false, false, 35.6762, 139.6503),
('port-025', 'AUBSB', 'Brisbane', 'AU', false, false, false, -27.4698, 153.0251);

-- Insert comprehensive fuels data
INSERT INTO fuels (id, code, name, lcv_mj_kg, default_ttw_gco2e_mj, default_wtt_gco2e_mj, default_co2_factor_t) VALUES 
('fuel-001', 'VLSFO', 'Very Low Sulphur Fuel Oil', 40.5, 77.4, 15.8, 3.114),
('fuel-002', 'MGO', 'Marine Gas Oil', 42.7, 74.1, 11.2, 3.206),
('fuel-003', 'HFO', 'Heavy Fuel Oil', 40.2, 77.4, 16.1, 3.114),
('fuel-004', 'LNG', 'Liquefied Natural Gas', 48.0, 56.9, 23.4, 2.750),
('fuel-005', 'METHANOL', 'Methanol', 19.9, 68.9, 35.2, 1.375),
('fuel-006', 'AMMONIA', 'Ammonia', 18.8, 0.0, 45.8, 0.000),
('fuel-007', 'HYDROGEN', 'Hydrogen', 120.0, 0.0, 120.0, 0.000),
('fuel-008', 'BIO-MGO', 'Bio Marine Gas Oil', 42.7, 25.0, 11.2, 1.082),
('fuel-009', 'BIO-VLSFO', 'Bio Very Low Sulphur Fuel Oil', 40.5, 25.0, 15.8, 1.005),
('fuel-010', 'E-METHANOL', 'E-Methanol', 19.9, 0.0, 35.2, 0.000),
('fuel-011', 'E-AMMONIA', 'E-Ammonia', 18.8, 0.0, 45.8, 0.000),
('fuel-012', 'E-LNG', 'E-Liquefied Natural Gas', 48.0, 0.0, 23.4, 0.000),
('fuel-013', 'HVO', 'Hydrotreated Vegetable Oil', 43.2, 25.0, 10.5, 1.082),
('fuel-014', 'FAME', 'Fatty Acid Methyl Ester', 37.5, 25.0, 12.8, 1.082),
('fuel-015', 'FT-DIESEL', 'Fischer-Tropsch Diesel', 43.2, 25.0, 10.5, 1.082),
('fuel-016', 'BATTERY', 'Battery (Electric)', 0.0, 0.0, 150.0, 0.000);

-- Insert sample vessels
INSERT INTO vessels (id, tenant_id, fleet_id, imo_number, name, vessel_type, flag_state, gross_tonnage, deadweight_tonnage, main_engine_type, ice_class) VALUES 
('vessel-001', 'tenant-001', 'fleet-001', 'IMO9876543', 'MV Atlantic Pioneer', 'Container Ship', 'NL', 50000, 65000, 'Diesel', NULL),
('vessel-002', 'tenant-001', 'fleet-001', 'IMO9876544', 'MV Nordic Explorer', 'Bulk Carrier', 'NO', 45000, 58000, 'Diesel', '1A'),
('vessel-003', 'tenant-001', 'fleet-001', 'IMO9876545', 'MV Baltic Star', 'Tanker', 'DK', 55000, 72000, 'Diesel', NULL),
('vessel-004', 'tenant-001', 'fleet-001', 'IMO9876546', 'MV Mediterranean Express', 'Container Ship', 'IT', 48000, 62000, 'LNG Dual-Fuel', NULL),
('vessel-005', 'tenant-001', 'fleet-001', 'IMO9876547', 'MV Thames Voyager', 'Ro-Ro Cargo', 'GB', 35000, 42000, 'Diesel', NULL),
('vessel-006', 'tenant-001', 'fleet-001', 'IMO9876548', 'MV Green Horizon', 'Container Ship', 'DE', 52000, 68000, 'LNG', NULL),
('vessel-007', 'tenant-001', 'fleet-001', 'IMO9876549', 'MV Clean Seas', 'Tanker', 'SE', 48000, 62000, 'Methanol', NULL),
('vessel-008', 'tenant-001', 'fleet-001', 'IMO9876550', 'MV Future Energy', 'Bulk Carrier', 'FI', 42000, 55000, 'Ammonia', NULL);

-- Insert sample voyages
INSERT INTO voyages (id, tenant_id, vessel_id, voyage_number, departure_port_id, arrival_port_id, departure_at, arrival_at, distance_nm, voyage_type, coverage_eu_pct, coverage_uk_pct, status) VALUES 
('voyage-001', 'tenant-001', 'vessel-001', 'ATP-2024-0001', 'port-001', 'port-002', '2025-01-15 08:00:00', '2025-01-15 14:00:00', 250, 'INTRA_EU', 1.00, 0.00, 'COMPLETED'),
('voyage-002', 'tenant-001', 'vessel-002', 'NEX-2024-0001', 'port-012', 'port-011', '2025-01-14 10:00:00', '2025-01-14 16:00:00', 320, 'INTRA_EU', 1.00, 0.00, 'COMPLETED'),
('voyage-003', 'tenant-001', 'vessel-003', 'BLS-2024-0001', 'port-015', 'port-021', '2025-01-12 06:00:00', '2025-01-20 18:00:00', 4850, 'EXTRA_EU', 0.50, 0.00, 'COMPLETED'),
('voyage-004', 'tenant-001', 'vessel-004', 'MEX-2024-0001', 'port-005', 'port-006', '2025-01-16 12:00:00', '2025-01-16 20:00:00', 280, 'INTRA_EU', 1.00, 0.00, 'COMPLETED'),
('voyage-005', 'tenant-001', 'vessel-005', 'TVY-2024-0001', 'port-016', 'port-017', '2025-01-17 14:00:00', '2025-01-17 18:00:00', 120, 'UK_DOMESTIC', 0.00, 1.00, 'COMPLETED'),
('voyage-006', 'tenant-001', 'vessel-006', 'GHZ-2024-0001', 'port-002', 'port-003', '2025-01-18 09:00:00', '2025-01-18 15:00:00', 200, 'INTRA_EU', 1.00, 0.00, 'COMPLETED'),
('voyage-007', 'tenant-001', 'vessel-007', 'CSZ-2024-0001', 'port-010', 'port-009', '2025-01-19 11:00:00', '2025-01-19 17:00:00', 180, 'INTRA_EU', 1.00, 0.00, 'COMPLETED'),
('voyage-008', 'tenant-001', 'vessel-008', 'FEZ-2024-0001', 'port-009', 'port-010', '2025-01-20 08:00:00', '2025-01-20 14:00:00', 160, 'INTRA_EU', 1.00, 0.00, 'PENDING');

-- Insert sample consumptions
INSERT INTO consumptions (id, voyage_id, fuel_id, mass_tonnes, engine_type, methane_slip_pct, location) VALUES 
-- Voyage 1 consumptions
('consumption-001', 'voyage-001', 'fuel-001', 125.5, 'Main Engine', NULL, 'AT_SEA'),
('consumption-002', 'voyage-001', 'fuel-002', 15.2, 'Auxiliary Engine', NULL, 'AT_SEA'),
('consumption-003', 'voyage-001', 'fuel-002', 8.5, 'Auxiliary Engine', NULL, 'AT_BERTH'),

-- Voyage 2 consumptions
('consumption-004', 'voyage-002', 'fuel-001', 180.3, 'Main Engine', NULL, 'AT_SEA'),
('consumption-005', 'voyage-002', 'fuel-002', 22.1, 'Auxiliary Engine', NULL, 'AT_SEA'),
('consumption-006', 'voyage-002', 'fuel-002', 12.8, 'Auxiliary Engine', NULL, 'AT_BERTH'),

-- Voyage 3 consumptions
('consumption-007', 'voyage-003', 'fuel-001', 1250.8, 'Main Engine', NULL, 'AT_SEA'),
('consumption-008', 'voyage-003', 'fuel-002', 95.4, 'Auxiliary Engine', NULL, 'AT_SEA'),
('consumption-009', 'voyage-003', 'fuel-002', 45.2, 'Auxiliary Engine', NULL, 'AT_BERTH'),

-- Voyage 4 consumptions (LNG vessel)
('consumption-010', 'voyage-004', 'fuel-004', 95.2, 'Main Engine', 0.2, 'AT_SEA'),
('consumption-011', 'voyage-004', 'fuel-002', 18.5, 'Auxiliary Engine', NULL, 'AT_SEA'),
('consumption-012', 'voyage-004', 'fuel-002', 10.2, 'Auxiliary Engine', NULL, 'AT_BERTH'),

-- Voyage 5 consumptions
('consumption-013', 'voyage-005', 'fuel-002', 45.8, 'Main Engine', NULL, 'AT_SEA'),
('consumption-014', 'voyage-005', 'fuel-002', 8.2, 'Auxiliary Engine', NULL, 'AT_SEA'),
('consumption-015', 'voyage-005', 'fuel-002', 5.5, 'Auxiliary Engine', NULL, 'AT_BERTH'),

-- Voyage 6 consumptions (LNG vessel)
('consumption-016', 'voyage-006', 'fuel-004', 78.9, 'Main Engine', 0.2, 'AT_SEA'),
('consumption-017', 'voyage-006', 'fuel-002', 15.2, 'Auxiliary Engine', NULL, 'AT_SEA'),
('consumption-018', 'voyage-006', 'fuel-002', 8.8, 'Auxiliary Engine', NULL, 'AT_BERTH'),

-- Voyage 7 consumptions (Methanol vessel)
('consumption-019', 'voyage-007', 'fuel-005', 142.3, 'Main Engine', NULL, 'AT_SEA'),
('consumption-020', 'voyage-007', 'fuel-002', 16.8, 'Auxiliary Engine', NULL, 'AT_SEA'),
('consumption-021', 'voyage-007', 'fuel-002', 9.5, 'Auxiliary Engine', NULL, 'AT_BERTH');

-- Insert regulatory constants
INSERT INTO regulatory_constants (id, constant_key, framework, value_json, effective_from, effective_to, version, source_regulation) VALUES 
-- FuelEU Maritime constants
('const-001', 'FUELEU_REFERENCE_CO2_INTENSITY', 'FUELEU', '{"value": 91.16, "unit": "gCO2e/MJ"}', '2025-01-01 00:00:00', NULL, '1.0', 'FuelEU Maritime Regulation'),
('const-002', 'FUELEU_WELL_TO_TANK_DEFAULT', 'FUELEU', '{"value": 15.8, "unit": "gCO2e/MJ"}', '2025-01-01 00:00:00', NULL, '1.0', 'FuelEU Maritime Regulation'),
('const-003', 'FUELEU_PENALTY_RATE', 'FUELEU', '{"value": 2400, "unit": "EUR/tCO2e"}', '2025-01-01 00:00:00', NULL, '1.0', 'FuelEU Maritime Regulation'),

-- EU ETS constants
('const-004', 'EU_ETS_ALLOWANCE_PRICE', 'EU_ETS', '{"value": 85.50, "unit": "EUR/tCO2e"}', '2025-01-01 00:00:00', NULL, '1.0', 'EU ETS Directive'),
('const-005', 'EU_ETS_SHIPPING_COVERAGE', 'EU_ETS', '{"value": 0.5, "unit": "ratio"}', '2025-01-01 00:00:00', NULL, '1.0', 'EU ETS Directive'),

-- IMO constants
('const-006', 'IMO_CII_REFERENCE_LINE', 'IMO', '{"value": 100, "unit": "%"}', '2025-01-01 00:00:00', NULL, '1.0', 'IMO MEPC Resolution'),
('const-007', 'IMO_CII_REDUCTION_RATE', 'IMO', '{"value": 2, "unit": "%/year"}', '2025-01-01 00:00:00', NULL, '1.0', 'IMO MEPC Resolution'),

-- UK ETS constants
('const-008', 'UK_ETS_ALLOWANCE_PRICE', 'UK_ETS', '{"value": 78.25, "unit": "GBP/tCO2e"}', '2025-01-01 00:00:00', NULL, '1.0', 'UK ETS Regulations');

-- Insert calculation formulas
INSERT INTO calculation_formulas (id, formula_key, framework, formula_expression, description, variables_schema_json, version, effective_from, effective_to, created_by) VALUES 
('formula-001', 'FUELEU_INTENSITY_CALC', 'FUELEU', '((TTW_CO2 + WTT_CO2) / ENERGY_MJ) * 1000', 'Calculate FuelEU CO2 intensity in gCO2e/MJ', '{"TTW_CO2": "number", "WTT_CO2": "number", "ENERGY_MJ": "number"}', '1.0', '2025-01-01 00:00:00', NULL, 'user-001'),
('formula-002', 'FUELEU_PENALTY_CALC', 'FUELEU', 'MAX(0, (INTENSITY - REFERENCE) * ENERGY_MJ / 1000 * PENALTY_RATE)', 'Calculate FuelEU penalties in EUR', '{"INTENSITY": "number", "REFERENCE": "number", "ENERGY_MJ": "number", "PENALTY_RATE": "number"}', '1.0', '2025-01-01 00:00:00', NULL, 'user-001'),
('formula-003', 'EU_ETS_ALLOWANCES', 'EU_ETS', 'CO2_EMISSIONS * COVERAGE_RATIO', 'Calculate required EU ETS allowances', '{"CO2_EMISSIONS": "number", "COVERAGE_RATIO": "number"}', '1.0', '2025-01-01 00:00:00', NULL, 'user-001'),
('formula-004', 'IMO_CII_CALC', 'IMO', '(CO2_EMISSIONS / TRANSPORT_WORK) / REFERENCE_LINE * 100', 'Calculate IMO CII rating', '{"CO2_EMISSIONS": "number", "TRANSPORT_WORK": "number", "REFERENCE_LINE": "number"}', '1.0', '2025-01-01 00:00:00', NULL, 'user-001');

-- Insert sample BDN records
INSERT INTO bdns (id, tenant_id, vessel_id, fuel_id, supplier_name, batch_number, delivery_date, delivered_mass_tonnes, lcv_mj_kg_actual, wtt_source, wtt_gco2e_mj_actual, verified) VALUES 
('bdn-001', 'tenant-001', 'vessel-001', 'fuel-001', 'Shell Marine', 'VLSFO-2025-001', '2025-01-10 14:30:00', 500.0, 40.8, 'Supplier Declaration', 16.2, true),
('bdn-002', 'tenant-001', 'vessel-002', 'fuel-001', 'Total Marine', 'VLSFO-2025-002', '2025-01-12 09:15:00', 750.0, 40.3, 'Supplier Declaration', 15.9, true),
('bdn-003', 'tenant-001', 'vessel-004', 'fuel-004', 'Gasum', 'LNG-2025-001', '2025-01-14 16:45:00', 300.0, 48.2, 'Supplier Declaration', 22.8, true),
('bdn-004', 'tenant-001', 'vessel-007', 'fuel-005', 'Methanex', 'METH-2025-001', '2025-01-16 11:20:00', 200.0, 19.8, 'Supplier Declaration', 34.5, true);

-- Insert sample OPS sessions
INSERT INTO ops_sessions (id, tenant_id, vessel_id, port_id, session_date, kwh_supplied, start_time, end_time, is_mandatory_port, verified) VALUES 
('ops-001', 'tenant-001', 'vessel-001', 'port-001', '2025-01-15 18:00:00', 2500.0, '2025-01-15 18:00:00', '2025-01-15 20:00:00', true, true),
('ops-002', 'tenant-001', 'vessel-002', 'port-012', '2025-01-14 16:00:00', 1800.0, '2025-01-14 16:00:00', '2025-01-14 18:30:00', true, true),
('ops-003', 'tenant-001', 'vessel-004', 'port-005', '2025-01-16 20:00:00', 3200.0, '2025-01-16 20:00:00', '2025-01-16 23:00:00', true, true),
('ops-004', 'tenant-001', 'vessel-005', 'port-016', '2025-01-17 19:00:00', 1500.0, '2025-01-17 19:00:00', '2025-01-17 21:00:00', false, false);

-- Insert sample audit logs
INSERT INTO audit_logs (id, tenant_id, user_id, entity_type, entity_id, action, new_value_json, timestamp) VALUES 
('audit-001', 'tenant-001', 'user-001', 'voyage', 'voyage-001', 'CREATE', '{"voyage_number": "ATP-2024-0001", "status": "COMPLETED"}', '2025-01-15 08:00:00'),
('audit-002', 'tenant-001', 'user-002', 'consumption', 'consumption-001', 'CREATE', '{"fuel_id": "fuel-001", "mass_tonnes": 125.5}', '2025-01-15 08:30:00'),
('audit-003', 'tenant-001', 'user-003', 'bdn', 'bdn-001', 'VERIFY', '{"verified": true}', '2025-01-10 15:00:00');

-- ============================================================
-- FINAL SETUP
-- ============================================================

-- Create a view for vessel compliance summary
CREATE VIEW vessel_compliance_summary AS
SELECT 
    v.id,
    v.name,
    v.imo_number,
    v.vessel_type,
    v.flag_state,
    COUNT(voy.id) as total_voyages,
    SUM(CASE WHEN voy.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_voyages,
    AVG(CASE WHEN voy.status = 'COMPLETED' THEN voy.coverage_eu_pct ELSE NULL END) as avg_eu_coverage,
    AVG(CASE WHEN voy.status = 'COMPLETED' THEN voy.coverage_uk_pct ELSE NULL END) as avg_uk_coverage
FROM vessels v
LEFT JOIN voyages voy ON v.id = voy.vessel_id
GROUP BY v.id, v.name, v.imo_number, v.vessel_type, v.flag_state;

-- Create a view for fuel consumption summary
CREATE VIEW fuel_consumption_summary AS
SELECT 
    f.code,
    f.name,
    COUNT(c.id) as consumption_records,
    SUM(c.mass_tonnes) as total_mass_tonnes,
    AVG(c.mass_tonnes) as avg_mass_tonnes,
    f.default_ttw_gco2e_mj,
    f.default_wtt_gco2e_mj
FROM fuels f
LEFT JOIN consumptions c ON f.id = c.fuel_id
GROUP BY f.id, f.code, f.name, f.default_ttw_gco2e_mj, f.default_wtt_gco2e_mj;

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'GHGConnect Database Build Complete!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Database contains:';
    RAISE NOTICE '- 1 Tenant: Maritime Compliance Solutions Ltd';
    RAISE NOTICE '- 1 Organization: Maritime Solutions Fleet Management';
    RAISE NOTICE '- 1 Fleet: European Coastal Fleet';
    RAISE NOTICE '- 3 Users (admin, compliance, ops)';
    RAISE NOTICE '- 25 Ports (EU, UK, International)';
    RAISE NOTICE '- 16 Fuel Types (including alternative fuels)';
    RAISE NOTICE '- 8 Vessels (various types and fuels)';
    RAISE NOTICE '- 8 Voyages (completed and pending)';
    RAISE NOTICE '- 21 Consumption Records';
    RAISE NOTICE '- 4 BDN Records';
    RAISE NOTICE '- 4 OPS Sessions';
    RAISE NOTICE '- 8 Regulatory Constants';
    RAISE NOTICE '- 4 Calculation Formulas';
    RAISE NOTICE '- 3 Audit Log Entries';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Login Credentials:';
    RAISE NOTICE '- Admin: admin@maritime-solutions.com / admin123';
    RAISE NOTICE '- Compliance: compliance@maritime-solutions.com / compliance123';
    RAISE NOTICE '- Ops: ops@maritime-solutions.com / ops123';
    RAISE NOTICE '============================================================';
END $$;

