-- Security configuration and roles

-- Create read-only role for reporting/analytics
CREATE ROLE ghgconnect_readonly;
GRANT CONNECT ON DATABASE ghgconnect_db TO ghgconnect_readonly;
GRANT USAGE ON SCHEMA ghgconnect TO ghgconnect_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA ghgconnect TO ghgconnect_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA ghgconnect GRANT SELECT ON TABLES TO ghgconnect_readonly;

-- Create application role with full access
CREATE ROLE ghgconnect_app;
GRANT CONNECT ON DATABASE ghgconnect_db TO ghgconnect_app;
GRANT USAGE, CREATE ON SCHEMA ghgconnect TO ghgconnect_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ghgconnect TO ghgconnect_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ghgconnect TO ghgconnect_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA ghgconnect GRANT ALL PRIVILEGES ON TABLES TO ghgconnect_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA ghgconnect GRANT ALL PRIVILEGES ON SEQUENCES TO ghgconnect_app;

-- Grant roles to the main user
GRANT ghgconnect_app TO ghgconnect_user;

-- Enable row-level security on sensitive tables (will be applied after tables are created)
-- This ensures tenant isolation at the database level

-- Audit trigger function for tracking changes
CREATE OR REPLACE FUNCTION ghgconnect.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO ghgconnect.audit_logs (
            tenant_id,
            entity_type,
            entity_id,
            action,
            new_value_json,
            timestamp
        ) VALUES (
            NEW.tenant_id,
            TG_TABLE_NAME,
            NEW.id,
            'CREATE',
            row_to_json(NEW),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO ghgconnect.audit_logs (
            tenant_id,
            entity_type,
            entity_id,
            action,
            old_value_json,
            new_value_json,
            timestamp
        ) VALUES (
            NEW.tenant_id,
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            row_to_json(OLD),
            row_to_json(NEW),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO ghgconnect.audit_logs (
            tenant_id,
            entity_type,
            entity_id,
            action,
            old_value_json,
            timestamp
        ) VALUES (
            OLD.tenant_id,
            TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            row_to_json(OLD),
            NOW()
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION ghgconnect.audit_trigger() IS 'Automatically logs changes to audited tables';

