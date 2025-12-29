-- ============================================================
-- User Access Control Migration
-- Adds tables for granular fleet/vessel access control and user preferences
-- ============================================================

-- Create user_fleet_access table
CREATE TABLE user_fleet_access (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fleet_id VARCHAR NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  granted_by VARCHAR NOT NULL REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Ensure unique user-fleet combinations
  UNIQUE(user_id, fleet_id)
);

-- Create user_vessel_access table
CREATE TABLE user_vessel_access (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vessel_id VARCHAR NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  granted_by VARCHAR NOT NULL REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Ensure unique user-vessel combinations
  UNIQUE(user_id, vessel_id)
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferences_json JSONB NOT NULL DEFAULT '{}',
  last_synced_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
-- User fleet access indexes
CREATE INDEX idx_user_fleet_access_user_id ON user_fleet_access(user_id);
CREATE INDEX idx_user_fleet_access_fleet_id ON user_fleet_access(fleet_id);
CREATE INDEX idx_user_fleet_access_user_fleet ON user_fleet_access(user_id, fleet_id);
CREATE INDEX idx_user_fleet_access_granted_by ON user_fleet_access(granted_by);
CREATE INDEX idx_user_fleet_access_expires_at ON user_fleet_access(expires_at) WHERE expires_at IS NOT NULL;

-- User vessel access indexes
CREATE INDEX idx_user_vessel_access_user_id ON user_vessel_access(user_id);
CREATE INDEX idx_user_vessel_access_vessel_id ON user_vessel_access(vessel_id);
CREATE INDEX idx_user_vessel_access_user_vessel ON user_vessel_access(user_id, vessel_id);
CREATE INDEX idx_user_vessel_access_granted_by ON user_vessel_access(granted_by);
CREATE INDEX idx_user_vessel_access_expires_at ON user_vessel_access(expires_at) WHERE expires_at IS NOT NULL;

-- User preferences indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_last_synced ON user_preferences(last_synced_at);
-- GIN index for JSONB queries
CREATE INDEX idx_user_preferences_json_gin ON user_preferences USING GIN (preferences_json);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_fleet_access_updated_at 
    BEFORE UPDATE ON user_fleet_access 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_vessel_access_updated_at 
    BEFORE UPDATE ON user_vessel_access 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_fleet_access IS 'Links users to specific fleets they can access with audit trail';
COMMENT ON TABLE user_vessel_access IS 'Links users to specific vessels they can access with audit trail';
COMMENT ON TABLE user_preferences IS 'Stores user preferences in JSONB format with sync tracking';

COMMENT ON COLUMN user_fleet_access.granted_by IS 'User who granted the access (for audit trail)';
COMMENT ON COLUMN user_fleet_access.expires_at IS 'Optional expiration date for temporary access';
COMMENT ON COLUMN user_vessel_access.granted_by IS 'User who granted the access (for audit trail)';
COMMENT ON COLUMN user_vessel_access.expires_at IS 'Optional expiration date for temporary access';
COMMENT ON COLUMN user_preferences.preferences_json IS 'JSONB containing all user preferences (currency, theme, etc.)';
COMMENT ON COLUMN user_preferences.last_synced_at IS 'Last time preferences were synced with client';


