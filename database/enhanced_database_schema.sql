-- ============================================================
-- GHGConnect Maritime Compliance Platform
-- Enhanced Database Schema with Triggers and System Admin Role
-- ============================================================
-- This script creates a comprehensive database structure with
-- proper triggers, audit logging, and system admin role management
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
DROP TYPE IF EXISTS system_role CASCADE;

-- Create enhanced enums
CREATE TYPE system_role AS ENUM (
  'SYSTEM_ADMIN',
  'TENANT_ADMIN', 
  'FLEET_MANAGER',
  'COMPLIANCE_OFFICER',
  'DATA_ANALYST',
  'VIEWER'
);

CREATE TYPE role AS ENUM (
  'OWNER',
  'ADMIN',
  'COMPLIANCE',
  'DATA_ENGINEER',
  'OPS',
  'FINANCE',
  'VIEWER'
);

CREATE TYPE framework AS ENUM (
  'FuelEU',
  'IMO',
  'EU_ETS',
  'CII',
  'EEXI'
);

CREATE TYPE voyage_type AS ENUM (
  'CARGO',
  'PASSENGER',
  'CARGO_PASSENGER',
  'TANKER',
  'CONTAINER',
  'BULK',
  'GENERAL'
);

CREATE TYPE location AS ENUM (
  'PORT',
  'AT_SEA',
  'ANCHORAGE',
  'BERTH'
);

CREATE TYPE run_type AS ENUM (
  'COMPLIANCE',
  'FORECAST',
  'SCENARIO',
  'OPTIMIZATION'
);

CREATE TYPE status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'PENDING',
  'SUSPENDED',
  'DELETED'
);

-- ============================================================
-- CORE SYSTEM TABLES
-- ============================================================

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status status DEFAULT 'ACTIVE'
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status status DEFAULT 'ACTIVE',
  created_by UUID,
  updated_by UUID
);

-- Fleets table with enhanced structure
CREATE TABLE fleets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status status DEFAULT 'ACTIVE',
  created_by UUID,
  updated_by UUID,
  vessel_count INTEGER DEFAULT 0,
  compliance_score DECIMAL(5,2) DEFAULT 0.00,
  total_ghg_emissions DECIMAL(15,2) DEFAULT 0.00,
  total_distance_nm DECIMAL(15,2) DEFAULT 0.00,
  total_fuel_consumption DECIMAL(15,2) DEFAULT 0.00
);

-- Users table with system roles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  system_role system_role DEFAULT 'VIEWER',
  mfa_secret VARCHAR(255),
  mfa_enabled BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status status DEFAULT 'ACTIVE',
  created_by UUID,
  updated_by UUID,
  preferences JSONB DEFAULT '{}'
);

-- User roles table (for additional role assignments)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role role NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  status status DEFAULT 'ACTIVE'
);

-- ============================================================
-- MARITIME DATA TABLES
-- ============================================================

-- Ports table
CREATE TABLE ports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  country VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fuels table
CREATE TABLE fuels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  carbon_factor DECIMAL(8, 4) NOT NULL,
  energy_content DECIMAL(8, 2),
  sulfur_content DECIMAL(5, 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vessels table with fleet relationship
CREATE TABLE vessels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  imo_number VARCHAR(10) UNIQUE NOT NULL,
  mmsi VARCHAR(15),
  call_sign VARCHAR(20),
  type VARCHAR(100) NOT NULL,
  flag VARCHAR(100) NOT NULL,
  gross_tonnage INTEGER,
  deadweight_tonnage INTEGER,
  length_overall DECIMAL(8, 2),
  beam DECIMAL(8, 2),
  draft DECIMAL(8, 2),
  engine_power INTEGER,
  fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  compliance_status VARCHAR(50) DEFAULT 'compliant',
  ghg_intensity DECIMAL(8, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status status DEFAULT 'ACTIVE',
  created_by UUID,
  updated_by UUID,
  settings JSONB DEFAULT '{}'
);

-- Voyages table
CREATE TABLE voyages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  voyage_number VARCHAR(50),
  voyage_type voyage_type NOT NULL,
  departure_port_id UUID REFERENCES ports(id),
  arrival_port_id UUID REFERENCES ports(id),
  departure_date TIMESTAMP WITH TIME ZONE,
  arrival_date TIMESTAMP WITH TIME ZONE,
  distance_nm DECIMAL(10, 2),
  cargo_weight DECIMAL(15, 2),
  cargo_volume DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status status DEFAULT 'ACTIVE'
);

-- Consumptions table
CREATE TABLE consumptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  fuel_id UUID NOT NULL REFERENCES fuels(id),
  quantity DECIMAL(15, 4) NOT NULL,
  location location NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- BDN (Bunker Delivery Note) table
CREATE TABLE bdns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  fuel_id UUID NOT NULL REFERENCES fuels(id),
  quantity DECIMAL(15, 4) NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  supplier VARCHAR(255),
  bdn_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Operations sessions table
CREATE TABLE ops_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  session_name VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location location NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Voyage segments table
CREATE TABLE voyage_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
  segment_number INTEGER NOT NULL,
  start_location VARCHAR(255),
  end_location VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  distance_nm DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Regulatory constants table
CREATE TABLE regulatory_constants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework framework NOT NULL,
  parameter_name VARCHAR(100) NOT NULL,
  parameter_value DECIMAL(15, 6) NOT NULL,
  unit VARCHAR(50),
  effective_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Calculation formulas table
CREATE TABLE calculation_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework framework NOT NULL,
  formula_name VARCHAR(100) NOT NULL,
  formula_expression TEXT NOT NULL,
  description TEXT,
  version VARCHAR(20),
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Calculation runs table
CREATE TABLE calc_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  framework framework NOT NULL,
  run_type run_type NOT NULL,
  run_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  parameters JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  status status DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parameters JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status status DEFAULT 'ACTIVE'
);

-- Scenario results table
CREATE TABLE scenario_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Primary indexes
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_fleets_org_id ON fleets(org_id);
CREATE INDEX idx_fleets_tenant_id ON fleets(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_vessels_fleet_id ON vessels(fleet_id);
CREATE INDEX idx_vessels_tenant_id ON vessels(tenant_id);
CREATE INDEX idx_vessels_imo ON vessels(imo_number);
CREATE INDEX idx_voyages_vessel_id ON voyages(vessel_id);
CREATE INDEX idx_consumptions_voyage_id ON consumptions(voyage_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Composite indexes
CREATE INDEX idx_user_roles_user_org ON user_roles(user_id, org_id);
CREATE INDEX idx_user_roles_user_fleet ON user_roles(user_id, fleet_id);
CREATE INDEX idx_vessels_fleet_tenant ON vessels(fleet_id, tenant_id);

-- Full-text search indexes
CREATE INDEX idx_vessels_name_trgm ON vessels USING gin(name gin_trgm_ops);
CREATE INDEX idx_fleets_name_trgm ON fleets USING gin(name gin_trgm_ops);
CREATE INDEX idx_organizations_name_trgm ON organizations USING gin(name gin_trgm_ops);

-- ============================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
    audit_tenant_id UUID;
BEGIN
    -- Get user_id and tenant_id from current context
    -- This would typically come from application context
    audit_user_id := COALESCE(NEW.created_by, NEW.updated_by, NULL);
    audit_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id, tenant_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), audit_user_id, audit_tenant_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id, tenant_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), audit_user_id, audit_tenant_id);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id, tenant_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), audit_user_id, audit_tenant_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update fleet vessel count
CREATE OR REPLACE FUNCTION update_fleet_vessel_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.fleet_id IS NOT NULL THEN
        UPDATE fleets SET vessel_count = vessel_count + 1 WHERE id = NEW.fleet_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle fleet change
        IF OLD.fleet_id IS DISTINCT FROM NEW.fleet_id THEN
            IF OLD.fleet_id IS NOT NULL THEN
                UPDATE fleets SET vessel_count = vessel_count - 1 WHERE id = OLD.fleet_id;
            END IF;
            IF NEW.fleet_id IS NOT NULL THEN
                UPDATE fleets SET vessel_count = vessel_count + 1 WHERE id = NEW.fleet_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.fleet_id IS NOT NULL THEN
        UPDATE fleets SET vessel_count = vessel_count - 1 WHERE id = OLD.fleet_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Function to validate system admin permissions
CREATE OR REPLACE FUNCTION validate_system_admin_permissions()
RETURNS TRIGGER AS $$
DECLARE
    user_system_role system_role;
BEGIN
    -- Get the system role of the user making the change
    SELECT system_role INTO user_system_role 
    FROM users 
    WHERE id = COALESCE(NEW.created_by, NEW.updated_by, OLD.created_by, OLD.updated_by);
    
    -- Only SYSTEM_ADMIN can create/update/delete certain critical records
    IF TG_TABLE_NAME IN ('tenants', 'organizations') AND user_system_role != 'SYSTEM_ADMIN' THEN
        RAISE EXCEPTION 'Only SYSTEM_ADMIN can perform this operation on %', TG_TABLE_NAME;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fleets_updated_at BEFORE UPDATE ON fleets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vessels_updated_at BEFORE UPDATE ON vessels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voyages_updated_at BEFORE UPDATE ON voyages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply audit log triggers
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON tenants FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_organizations AFTER INSERT OR UPDATE OR DELETE ON organizations FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_fleets AFTER INSERT OR UPDATE OR DELETE ON fleets FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_vessels AFTER INSERT OR UPDATE OR DELETE ON vessels FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_voyages AFTER INSERT OR UPDATE OR DELETE ON voyages FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Apply fleet vessel count trigger
CREATE TRIGGER update_fleet_vessel_count_trigger AFTER INSERT OR UPDATE OR DELETE ON vessels FOR EACH ROW EXECUTE FUNCTION update_fleet_vessel_count();

-- Apply system admin permission triggers
CREATE TRIGGER validate_tenants_admin_permissions BEFORE INSERT OR UPDATE OR DELETE ON tenants FOR EACH ROW EXECUTE FUNCTION validate_system_admin_permissions();
CREATE TRIGGER validate_organizations_admin_permissions BEFORE INSERT OR UPDATE OR DELETE ON organizations FOR EACH ROW EXECUTE FUNCTION validate_system_admin_permissions();

-- ============================================================
-- INITIAL DATA SEEDING
-- ============================================================

-- Insert default tenant
INSERT INTO tenants (id, name, domain, settings) VALUES 
('dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'GHGConnect Demo', 'ghgconnect.local', '{"theme": "light", "timezone": "UTC"}');

-- Insert system admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, tenant_id, system_role, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin@ghgconnect.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK1aK', 'System', 'Administrator', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'SYSTEM_ADMIN', 'ACTIVE');

-- Insert demo organizations
INSERT INTO organizations (id, name, description, tenant_id, created_by) VALUES 
('org-001', 'Maritime Solutions Inc', 'Leading maritime compliance solutions provider', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('org-002', 'Ocean Transport Ltd', 'International shipping and logistics company', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('org-003', 'Green Shipping Co', 'Sustainable maritime operations specialist', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000');

-- Insert demo fleets
INSERT INTO fleets (id, name, description, org_id, tenant_id, created_by) VALUES 
('fleet-001', 'Mediterranean Fleet', 'Fleet operating in Mediterranean waters', 'org-001', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('fleet-002', 'North Sea Operations', 'North Sea shipping operations', 'org-001', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('fleet-003', 'Trans-Atlantic Fleet', 'Trans-Atlantic shipping services', 'org-002', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('fleet-004', 'Coastal Operations', 'Coastal and short-sea shipping', 'org-003', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000');

-- Insert demo ports
INSERT INTO ports (id, name, code, country, latitude, longitude) VALUES 
('port-001', 'Rotterdam', 'NLRTM', 'Netherlands', 51.9225, 4.4792),
('port-002', 'Hamburg', 'DEHAM', 'Germany', 53.5511, 9.9937),
('port-003', 'Antwerp', 'BEANR', 'Belgium', 51.2194, 4.4025),
('port-004', 'Genoa', 'ITGOA', 'Italy', 44.4056, 8.9463),
('port-005', 'Marseille', 'FRMRS', 'France', 43.2965, 5.3698);

-- Insert demo fuels
INSERT INTO fuels (id, name, type, carbon_factor, energy_content, sulfur_content) VALUES 
('fuel-001', 'Marine Gas Oil (MGO)', 'DISTILLATE', 3.206, 42.7, 0.1),
('fuel-002', 'Heavy Fuel Oil (HFO)', 'RESIDUAL', 3.114, 40.4, 3.5),
('fuel-003', 'Very Low Sulfur Fuel Oil (VLSFO)', 'RESIDUAL', 3.114, 40.4, 0.5),
('fuel-004', 'Liquefied Natural Gas (LNG)', 'GAS', 2.75, 45.0, 0.0);

-- Insert demo vessels (26 vessels as requested)
INSERT INTO vessels (id, name, imo_number, mmsi, call_sign, type, flag, gross_tonnage, deadweight_tonnage, length_overall, beam, draft, engine_power, fleet_id, tenant_id, compliance_status, ghg_intensity, created_by) VALUES 
('vessel-001', 'Adriatic Star', 'IMO09876555', '247123456', 'ADST', 'Ro-Ro Cargo', 'Italy', 25000, 15000, 180.5, 25.8, 8.2, 12000, 'fleet-001', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 12.5, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-002', 'Arctic Guardian', 'IMO09876556', '247123457', 'ARCG', 'Tanker', 'Finland', 45000, 35000, 220.0, 32.0, 12.5, 18000, 'fleet-001', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 15.2, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-003', 'Atlantic Pioneer', 'IMO09876557', '247123458', 'ATLP', 'Container Ship', 'Netherlands', 65000, 50000, 280.0, 40.0, 14.0, 25000, 'fleet-001', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 18.7, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-004', 'Baltic Star', 'IMO09876558', '247123459', 'BALT', 'General Cargo', 'Poland', 18000, 12000, 160.0, 22.5, 7.8, 8500, 'fleet-001', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'non-compliant', 22.1, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-005', 'Caribbean Queen', 'IMO09876559', '247123460', 'CARQ', 'Passenger Ship', 'Portugal', 35000, 20000, 200.0, 28.0, 9.5, 15000, 'fleet-001', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 14.3, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-006', 'Nordic Explorer', 'IMO09876560', '247123461', 'NORD', 'Bulk Carrier', 'Sweden', 55000, 45000, 250.0, 35.0, 13.2, 20000, 'fleet-002', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 16.8, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-007', 'Pacific Voyager', 'IMO09876561', '247123462', 'PACV', 'Container Ship', 'Denmark', 70000, 55000, 300.0, 42.0, 15.0, 28000, 'fleet-002', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 19.2, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-008', 'Mediterranean Express', 'IMO09876562', '247123463', 'MEDX', 'Ro-Ro Cargo', 'Spain', 30000, 20000, 190.0, 26.0, 8.5, 13000, 'fleet-002', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 13.7, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-009', 'Ocean Navigator', 'IMO09876563', '247123464', 'OCNA', 'Tanker', 'Norway', 50000, 40000, 240.0, 34.0, 12.8, 22000, 'fleet-002', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 17.4, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-010', 'Southern Cross', 'IMO09876564', '247123465', 'SOUC', 'General Cargo', 'Greece', 22000, 15000, 170.0, 24.0, 8.0, 9500, 'fleet-002', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 15.9, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-011', 'Western Horizon', 'IMO09876565', '247123466', 'WEHO', 'Bulk Carrier', 'United Kingdom', 60000, 50000, 270.0, 38.0, 14.5, 24000, 'fleet-003', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 18.1, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-012', 'Eastern Star', 'IMO09876566', '247123467', 'EAST', 'Container Ship', 'Germany', 75000, 60000, 320.0, 44.0, 16.0, 30000, 'fleet-003', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 20.5, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-013', 'Northern Light', 'IMO09876567', '247123468', 'NOLI', 'Tanker', 'Netherlands', 48000, 38000, 230.0, 33.0, 12.0, 19000, 'fleet-003', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 16.3, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-014', 'Central Express', 'IMO09876568', '247123469', 'CENX', 'Ro-Ro Cargo', 'Belgium', 28000, 18000, 185.0, 25.5, 8.3, 11000, 'fleet-003', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 14.6, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-015', 'Global Trader', 'IMO09876569', '247123470', 'GLOT', 'General Cargo', 'France', 26000, 17000, 175.0, 23.5, 7.9, 10000, 'fleet-003', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 13.8, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-016', 'Maritime Spirit', 'IMO09876570', '247123471', 'MASP', 'Bulk Carrier', 'Italy', 52000, 42000, 245.0, 36.0, 13.5, 21000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 17.7, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-017', 'Coastal Runner', 'IMO09876571', '247123472', 'CORU', 'Container Ship', 'Spain', 68000, 52000, 290.0, 41.0, 14.8, 26000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 19.8, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-018', 'Harbor Master', 'IMO09876572', '247123473', 'HAMA', 'Tanker', 'Portugal', 46000, 36000, 225.0, 32.5, 11.8, 18000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 16.9, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-019', 'Port Authority', 'IMO09876573', '247123474', 'PORA', 'Ro-Ro Cargo', 'Greece', 32000, 22000, 195.0, 27.0, 9.0, 14000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 15.4, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-020', 'Dock Worker', 'IMO09876574', '247123475', 'DOWO', 'General Cargo', 'Croatia', 24000, 16000, 165.0, 22.0, 7.5, 9000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 14.2, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-021', 'Sea Breeze', 'IMO09876575', '247123476', 'SEBR', 'Passenger Ship', 'Malta', 40000, 25000, 210.0, 29.0, 10.0, 16000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 15.7, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-022', 'Wind Rider', 'IMO09876576', '247123477', 'WIRI', 'Bulk Carrier', 'Cyprus', 58000, 48000, 260.0, 37.0, 14.0, 23000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 18.9, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-023', 'Tide Turner', 'IMO09876577', '247123478', 'TITU', 'Container Ship', 'Slovenia', 72000, 58000, 310.0, 43.0, 15.5, 29000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 21.2, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-024', 'Wave Runner', 'IMO09876578', '247123479', 'WARU', 'Tanker', 'Estonia', 49000, 39000, 235.0, 33.5, 12.2, 19500, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 17.1, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-025', 'Current Master', 'IMO09876579', '247123480', 'CUMA', 'Ro-Ro Cargo', 'Latvia', 29000, 19000, 180.0, 24.5, 8.1, 12000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 14.9, '550e8400-e29b-41d4-a716-446655440000'),
('vessel-026', 'Flow Controller', 'IMO09876580', '247123481', 'FLCO', 'General Cargo', 'Lithuania', 20000, 13000, 155.0, 21.0, 7.2, 8000, 'fleet-004', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 13.5, '550e8400-e29b-41d4-a716-446655440000');

-- Insert demo voyages
INSERT INTO voyages (id, vessel_id, voyage_number, voyage_type, departure_port_id, arrival_port_id, departure_date, arrival_date, distance_nm, cargo_weight) VALUES 
('voyage-001', 'vessel-001', 'V001-2024', 'CARGO', 'port-001', 'port-002', '2024-01-15 08:00:00+00', '2024-01-16 14:00:00+00', 250.5, 12000.0),
('voyage-002', 'vessel-002', 'V002-2024', 'TANKER', 'port-002', 'port-003', '2024-01-16 10:00:00+00', '2024-01-17 16:00:00+00', 180.2, 30000.0),
('voyage-003', 'vessel-003', 'V003-2024', 'CONTAINER', 'port-003', 'port-004', '2024-01-17 12:00:00+00', '2024-01-18 18:00:00+00', 320.8, 45000.0);

-- Insert demo consumptions
INSERT INTO consumptions (id, voyage_id, fuel_id, quantity, location, timestamp) VALUES 
('cons-001', 'voyage-001', 'fuel-001', 45.5, 'AT_SEA', '2024-01-15 12:00:00+00'),
('cons-002', 'voyage-001', 'fuel-001', 38.2, 'PORT', '2024-01-15 20:00:00+00'),
('cons-003', 'voyage-002', 'fuel-002', 120.8, 'AT_SEA', '2024-01-16 14:00:00+00'),
('cons-004', 'voyage-003', 'fuel-003', 95.6, 'AT_SEA', '2024-01-17 16:00:00+00');

-- Insert regulatory constants
INSERT INTO regulatory_constants (id, framework, parameter_name, parameter_value, unit, effective_date) VALUES 
('const-001', 'FuelEU', 'CO2_FACTOR_MGO', 3.206, 'tCO2/t', '2024-01-01'),
('const-002', 'FuelEU', 'CO2_FACTOR_HFO', 3.114, 'tCO2/t', '2024-01-01'),
('const-003', 'IMO', 'EEXI_REFERENCE_LINE', 0.001, 'gCO2/t·nm', '2024-01-01'),
('const-004', 'EU_ETS', 'CARBON_PRICE', 85.50, 'EUR/tCO2', '2024-01-01');

-- Insert calculation formulas
INSERT INTO calculation_formulas (id, framework, formula_name, formula_expression, description, version, effective_date) VALUES 
('formula-001', 'FuelEU', 'GHG_INTENSITY', 'total_co2_emissions / total_energy_consumed', 'Calculate GHG intensity for FuelEU compliance', '1.0', '2024-01-01'),
('formula-002', 'IMO', 'EEXI_CALCULATION', 'engine_power * specific_fuel_consumption * carbon_factor / (capacity * reference_speed)', 'Calculate EEXI for IMO compliance', '1.0', '2024-01-01'),
('formula-003', 'EU_ETS', 'EMISSIONS_COST', 'total_co2_emissions * carbon_price', 'Calculate emissions cost for EU ETS', '1.0', '2024-01-01');

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- Fleet summary view
CREATE VIEW fleet_summary AS
SELECT 
    f.id,
    f.name,
    f.description,
    f.vessel_count,
    f.compliance_score,
    f.total_ghg_emissions,
    f.total_distance_nm,
    f.total_fuel_consumption,
    o.name as organization_name,
    t.name as tenant_name,
    f.created_at,
    f.updated_at,
    f.status
FROM fleets f
JOIN organizations o ON f.org_id = o.id
JOIN tenants t ON f.tenant_id = t.id;

-- Vessel summary view
CREATE VIEW vessel_summary AS
SELECT 
    v.id,
    v.name,
    v.imo_number,
    v.type,
    v.flag,
    v.compliance_status,
    v.ghg_intensity,
    f.name as fleet_name,
    o.name as organization_name,
    t.name as tenant_name,
    v.created_at,
    v.updated_at,
    v.status
FROM vessels v
LEFT JOIN fleets f ON v.fleet_id = f.id
JOIN tenants t ON v.tenant_id = t.id
LEFT JOIN organizations o ON f.org_id = o.id;

-- ============================================================
-- GRANTS AND PERMISSIONS
-- ============================================================

-- Grant permissions to application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ghgconnect_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ghgconnect_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ghgconnect_user;
GRANT USAGE ON SCHEMA public TO ghgconnect_user;

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'GHGConnect Database Schema Created Successfully!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Tables created: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE 'Triggers created: %', (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public');
    RAISE NOTICE 'Functions created: %', (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public');
    RAISE NOTICE 'Views created: %', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public');
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'System Admin User: admin@ghgconnect.com';
    RAISE NOTICE 'Default Tenant ID: dfa5de92-6ab2-47d4-b19c-87c01b692c94';
    RAISE NOTICE 'Organizations: 3';
    RAISE NOTICE 'Fleets: 4';
    RAISE NOTICE 'Vessels: 26';
    RAISE NOTICE '============================================================';
END $$;

