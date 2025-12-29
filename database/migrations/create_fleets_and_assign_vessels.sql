-- Create Fleets and Assign Vessels
-- This script creates 4 different fleets and assigns the 26 vessels to them

-- First, let's create 4 fleets
INSERT INTO fleets (id, org_id, name, description, created_at) VALUES
('fleet-1', 'org-1', 'European Coastal Fleet', 'Fleet operating in European coastal waters with focus on short-haul routes', NOW()),
('fleet-2', 'org-1', 'Transatlantic Fleet', 'Long-distance fleet operating transatlantic routes between Europe and Americas', NOW()),
('fleet-3', 'org-1', 'Mediterranean Fleet', 'Fleet specializing in Mediterranean and Black Sea operations', NOW()),
('fleet-4', 'org-1', 'Arctic Fleet', 'Specialized fleet for Arctic and Northern European operations', NOW());

-- Now assign vessels to fleets based on their characteristics
-- European Coastal Fleet (fleet-1) - Short haul vessels
UPDATE vessels SET fleet_id = 'fleet-1' WHERE name IN (
  'Adriatic Star', 'Celtic Pride', 'Nordic Explorer', 'Baltic Star', 'Scandinavian Queen'
);

-- Transatlantic Fleet (fleet-2) - Large vessels for long distances
UPDATE vessels SET fleet_id = 'fleet-2' WHERE name IN (
  'Atlantic Pioneer', 'Ocean Voyager', 'Maritime Express', 'Global Navigator', 'Pacific Explorer',
  'Continental Carrier', 'International Trader', 'Worldwide Merchant', 'Universal Carrier'
);

-- Mediterranean Fleet (fleet-3) - Mediterranean operations
UPDATE vessels SET fleet_id = 'fleet-3' WHERE name IN (
  'Mediterranean Star', 'Aegean Explorer', 'Ionian Navigator', 'Adriatic Express', 'Tyrrhenian Voyager',
  'Black Sea Trader', 'Levant Carrier', 'Caspian Merchant'
);

-- Arctic Fleet (fleet-4) - Arctic and Northern European vessels
UPDATE vessels SET fleet_id = 'fleet-4' WHERE name IN (
  'Arctic Guardian', 'Nordic Explorer', 'Polar Pioneer', 'Fjord Navigator', 'Icebreaker Express',
  'Northern Star', 'Aurora Voyager', 'Frost Trader'
);

-- Verify the assignments
SELECT 
  f.name as fleet_name,
  COUNT(v.id) as vessel_count,
  STRING_AGG(v.name, ', ') as vessels
FROM fleets f
LEFT JOIN vessels v ON f.id = v.fleet_id
GROUP BY f.id, f.name
ORDER BY f.name;


