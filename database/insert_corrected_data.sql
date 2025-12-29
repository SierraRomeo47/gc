-- ============================================================
-- GHGConnect Data Insertion Script (Corrected UUIDs)
-- ============================================================
-- This script inserts the correct data with proper UUID format

-- Insert default tenant
INSERT INTO tenants (id, name, domain, settings) VALUES 
('dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'GHGConnect Demo', 'ghgconnect.local', '{"theme": "light", "timezone": "UTC"}');

-- Insert system admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, tenant_id, system_role, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin@ghgconnect.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK1aK', 'System', 'Administrator', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'SYSTEM_ADMIN', 'ACTIVE');

-- Insert demo organizations
INSERT INTO organizations (id, name, description, tenant_id, created_by) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Maritime Solutions Inc', 'Leading maritime compliance solutions provider', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', 'Ocean Transport Ltd', 'International shipping and logistics company', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440003', 'Green Shipping Co', 'Sustainable maritime operations specialist', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000');

-- Insert demo fleets
INSERT INTO fleets (id, name, description, org_id, tenant_id, created_by) VALUES 
('550e8400-e29b-41d4-a716-446655440101', 'Mediterranean Fleet', 'Fleet operating in Mediterranean waters', '550e8400-e29b-41d4-a716-446655440001', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440102', 'North Sea Operations', 'North Sea shipping operations', '550e8400-e29b-41d4-a716-446655440001', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440103', 'Trans-Atlantic Fleet', 'Trans-Atlantic shipping services', '550e8400-e29b-41d4-a716-446655440002', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440104', 'Coastal Operations', 'Coastal and short-sea shipping', '550e8400-e29b-41d4-a716-446655440003', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', '550e8400-e29b-41d4-a716-446655440000');

-- Insert demo ports
INSERT INTO ports (id, name, code, country, latitude, longitude) VALUES 
('550e8400-e29b-41d4-a716-446655440201', 'Rotterdam', 'NLRTM', 'Netherlands', 51.9225, 4.4792),
('550e8400-e29b-41d4-a716-446655440202', 'Hamburg', 'DEHAM', 'Germany', 53.5511, 9.9937),
('550e8400-e29b-41d4-a716-446655440203', 'Antwerp', 'BEANR', 'Belgium', 51.2194, 4.4025),
('550e8400-e29b-41d4-a716-446655440204', 'Genoa', 'ITGOA', 'Italy', 44.4056, 8.9463),
('550e8400-e29b-41d4-a716-446655440205', 'Marseille', 'FRMRS', 'France', 43.2965, 5.3698);

-- Insert demo fuels
INSERT INTO fuels (id, name, type, carbon_factor, energy_content, sulfur_content) VALUES 
('550e8400-e29b-41d4-a716-446655440301', 'Marine Gas Oil (MGO)', 'DISTILLATE', 3.206, 42.7, 0.1),
('550e8400-e29b-41d4-a716-446655440302', 'Heavy Fuel Oil (HFO)', 'RESIDUAL', 3.114, 40.4, 3.5),
('550e8400-e29b-41d4-a716-446655440303', 'Very Low Sulfur Fuel Oil (VLSFO)', 'RESIDUAL', 3.114, 40.4, 0.5),
('550e8400-e29b-41d4-a716-446655440304', 'Liquefied Natural Gas (LNG)', 'GAS', 2.75, 45.0, 0.0);

-- Insert demo vessels (26 vessels as requested)
INSERT INTO vessels (id, name, imo_number, mmsi, call_sign, type, flag, gross_tonnage, deadweight_tonnage, length_overall, beam, draft, engine_power, fleet_id, tenant_id, compliance_status, ghg_intensity, created_by) VALUES 
('550e8400-e29b-41d4-a716-446655440401', 'Adriatic Star', 'IMO09876555', '247123456', 'ADST', 'Ro-Ro Cargo', 'Italy', 25000, 15000, 180.5, 25.8, 8.2, 12000, '550e8400-e29b-41d4-a716-446655440101', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 12.5, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440402', 'Arctic Guardian', 'IMO09876556', '247123457', 'ARCG', 'Tanker', 'Finland', 45000, 35000, 220.0, 32.0, 12.5, 18000, '550e8400-e29b-41d4-a716-446655440101', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 15.2, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440403', 'Atlantic Pioneer', 'IMO09876557', '247123458', 'ATLP', 'Container Ship', 'Netherlands', 65000, 50000, 280.0, 40.0, 14.0, 25000, '550e8400-e29b-41d4-a716-446655440101', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 18.7, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440404', 'Baltic Star', 'IMO09876558', '247123459', 'BALT', 'General Cargo', 'Poland', 18000, 12000, 160.0, 22.5, 7.8, 8500, '550e8400-e29b-41d4-a716-446655440101', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'non-compliant', 22.1, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440405', 'Caribbean Queen', 'IMO09876559', '247123460', 'CARQ', 'Passenger Ship', 'Portugal', 35000, 20000, 200.0, 28.0, 9.5, 15000, '550e8400-e29b-41d4-a716-446655440101', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 14.3, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440406', 'Nordic Explorer', 'IMO09876560', '247123461', 'NORD', 'Bulk Carrier', 'Sweden', 55000, 45000, 250.0, 35.0, 13.2, 20000, '550e8400-e29b-41d4-a716-446655440102', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 16.8, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440407', 'Pacific Voyager', 'IMO09876561', '247123462', 'PACV', 'Container Ship', 'Denmark', 70000, 55000, 300.0, 42.0, 15.0, 28000, '550e8400-e29b-41d4-a716-446655440102', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 19.2, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440408', 'Mediterranean Express', 'IMO09876562', '247123463', 'MEDX', 'Ro-Ro Cargo', 'Spain', 30000, 20000, 190.0, 26.0, 8.5, 13000, '550e8400-e29b-41d4-a716-446655440102', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 13.7, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440409', 'Ocean Navigator', 'IMO09876563', '247123464', 'OCNA', 'Tanker', 'Norway', 50000, 40000, 240.0, 34.0, 12.8, 22000, '550e8400-e29b-41d4-a716-446655440102', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 17.4, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440410', 'Southern Cross', 'IMO09876564', '247123465', 'SOUC', 'General Cargo', 'Greece', 22000, 15000, 170.0, 24.0, 8.0, 9500, '550e8400-e29b-41d4-a716-446655440102', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 15.9, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440411', 'Western Horizon', 'IMO09876565', '247123466', 'WEHO', 'Bulk Carrier', 'United Kingdom', 60000, 50000, 270.0, 38.0, 14.5, 24000, '550e8400-e29b-41d4-a716-446655440103', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 18.1, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440412', 'Eastern Star', 'IMO09876566', '247123467', 'EAST', 'Container Ship', 'Germany', 75000, 60000, 320.0, 44.0, 16.0, 30000, '550e8400-e29b-41d4-a716-446655440103', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 20.5, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440413', 'Northern Light', 'IMO09876567', '247123468', 'NOLI', 'Tanker', 'Netherlands', 48000, 38000, 230.0, 33.0, 12.0, 19000, '550e8400-e29b-41d4-a716-446655440103', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 16.3, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440414', 'Central Express', 'IMO09876568', '247123469', 'CENX', 'Ro-Ro Cargo', 'Belgium', 28000, 18000, 185.0, 25.5, 8.3, 11000, '550e8400-e29b-41d4-a716-446655440103', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 14.6, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440415', 'Global Trader', 'IMO09876569', '247123470', 'GLOT', 'General Cargo', 'France', 26000, 17000, 175.0, 23.5, 7.9, 10000, '550e8400-e29b-41d4-a716-446655440103', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 13.8, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440416', 'Maritime Spirit', 'IMO09876570', '247123471', 'MASP', 'Bulk Carrier', 'Italy', 52000, 42000, 245.0, 36.0, 13.5, 21000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 17.7, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440417', 'Coastal Runner', 'IMO09876571', '247123472', 'CORU', 'Container Ship', 'Spain', 68000, 52000, 290.0, 41.0, 14.8, 26000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 19.8, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440418', 'Harbor Master', 'IMO09876572', '247123473', 'HAMA', 'Tanker', 'Portugal', 46000, 36000, 225.0, 32.5, 11.8, 18000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 16.9, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440419', 'Port Authority', 'IMO09876573', '247123474', 'PORA', 'Ro-Ro Cargo', 'Greece', 32000, 22000, 195.0, 27.0, 9.0, 14000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 15.4, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440420', 'Dock Worker', 'IMO09876574', '247123475', 'DOWO', 'General Cargo', 'Croatia', 24000, 16000, 165.0, 22.0, 7.5, 9000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 14.2, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440421', 'Sea Breeze', 'IMO09876575', '247123476', 'SEBR', 'Passenger Ship', 'Malta', 40000, 25000, 210.0, 29.0, 10.0, 16000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 15.7, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440422', 'Wind Rider', 'IMO09876576', '247123477', 'WIRI', 'Bulk Carrier', 'Cyprus', 58000, 48000, 260.0, 37.0, 14.0, 23000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 18.9, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440423', 'Tide Turner', 'IMO09876577', '247123478', 'TITU', 'Container Ship', 'Slovenia', 72000, 58000, 310.0, 43.0, 15.5, 29000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 21.2, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440424', 'Wave Runner', 'IMO09876578', '247123479', 'WARU', 'Tanker', 'Estonia', 49000, 39000, 235.0, 33.5, 12.2, 19500, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 17.1, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440425', 'Current Master', 'IMO09876579', '247123480', 'CUMA', 'Ro-Ro Cargo', 'Latvia', 29000, 19000, 180.0, 24.5, 8.1, 12000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 14.9, '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440426', 'Flow Controller', 'IMO09876580', '247123481', 'FLCO', 'General Cargo', 'Lithuania', 20000, 13000, 155.0, 21.0, 7.2, 8000, '550e8400-e29b-41d4-a716-446655440104', 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', 'compliant', 13.5, '550e8400-e29b-41d4-a716-446655440000');

-- Insert demo voyages
INSERT INTO voyages (id, vessel_id, voyage_number, voyage_type, departure_port_id, arrival_port_id, departure_date, arrival_date, distance_nm, cargo_weight) VALUES 
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440401', 'V001-2024', 'CARGO', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440202', '2024-01-15 08:00:00+00', '2024-01-16 14:00:00+00', 250.5, 12000.0),
('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440402', 'V002-2024', 'TANKER', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440203', '2024-01-16 10:00:00+00', '2024-01-17 16:00:00+00', 180.2, 30000.0),
('550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440403', 'V003-2024', 'CONTAINER', '550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440204', '2024-01-17 12:00:00+00', '2024-01-18 18:00:00+00', 320.8, 45000.0);

-- Insert demo consumptions
INSERT INTO consumptions (id, voyage_id, fuel_id, quantity, location, timestamp) VALUES 
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440301', 45.5, 'AT_SEA', '2024-01-15 12:00:00+00'),
('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440301', 38.2, 'PORT', '2024-01-15 20:00:00+00'),
('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440302', 120.8, 'AT_SEA', '2024-01-16 14:00:00+00'),
('550e8400-e29b-41d4-a716-446655440604', '550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440303', 95.6, 'AT_SEA', '2024-01-17 16:00:00+00');

-- Insert regulatory constants
INSERT INTO regulatory_constants (id, framework, parameter_name, parameter_value, unit, effective_date) VALUES 
('550e8400-e29b-41d4-a716-446655440701', 'FuelEU', 'CO2_FACTOR_MGO', 3.206, 'tCO2/t', '2024-01-01'),
('550e8400-e29b-41d4-a716-446655440702', 'FuelEU', 'CO2_FACTOR_HFO', 3.114, 'tCO2/t', '2024-01-01'),
('550e8400-e29b-41d4-a716-446655440703', 'IMO', 'EEXI_REFERENCE_LINE', 0.001, 'gCO2/t·nm', '2024-01-01'),
('550e8400-e29b-41d4-a716-446655440704', 'EU_ETS', 'CARBON_PRICE', 85.50, 'EUR/tCO2', '2024-01-01');

-- Insert calculation formulas
INSERT INTO calculation_formulas (id, framework, formula_name, formula_expression, description, version, effective_date) VALUES 
('550e8400-e29b-41d4-a716-446655440801', 'FuelEU', 'GHG_INTENSITY', 'total_co2_emissions / total_energy_consumed', 'Calculate GHG intensity for FuelEU compliance', '1.0', '2024-01-01'),
('550e8400-e29b-41d4-a716-446655440802', 'IMO', 'EEXI_CALCULATION', 'engine_power * specific_fuel_consumption * carbon_factor / (capacity * reference_speed)', 'Calculate EEXI for IMO compliance', '1.0', '2024-01-01'),
('550e8400-e29b-41d4-a716-446655440803', 'EU_ETS', 'EMISSIONS_COST', 'total_co2_emissions * carbon_price', 'Calculate emissions cost for EU ETS', '1.0', '2024-01-01');

