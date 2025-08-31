-- Migration: Fix hierarchy implementation for existing database
-- Date: 2025-08-31 (UPDATED)
-- Description: Apply hierarchy fixes for existing database structure (FIXED TABLE NAMES)

-- Update user types constraint to support new hierarchy (already done in 002)
-- Skipping to avoid conflicts

-- Update existing admin to system_admin (already done in 002)
-- Skipping to avoid conflicts

-- Create missing function for updated_at trigger (already created in 001)
-- Skipping to avoid conflicts

-- Add updated_at triggers to new tables (use correct table names)
DROP TRIGGER IF EXISTS update_clubes_updated_at ON clubes;
-- Skip trigger creation as it's already done in migration 004

DROP TRIGGER IF EXISTS update_licencas_updated_at ON licencas;
-- Skip trigger creation as it's already done in migration 004

-- Create composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clube_tipo ON users(clube_id, tipo) WHERE clube_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_clube_data ON eventos(clube_id, data_evento) WHERE clube_id IS NOT NULL;

-- Add any missing foreign key constraints for data integrity
-- Skip if already exists (handled by migration 004)

-- Create admin user if doesn't exist
INSERT INTO users (nome, email, senha_hash, tipo)
SELECT 'System Administrator', 'admin@clubetiro.com', '$2b$12$dummy.hash.for.development.only', 'system_admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@clubetiro.com'
);

-- Update data types for better consistency
-- Skip if already done

-- Create view for administrative insights (if not exists)
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE ativo = true) as active_users,
    (SELECT COUNT(*) FROM users WHERE associado = true) as active_members,
    (SELECT COUNT(*) FROM eventos WHERE status = 'inscricoes_abertas') as open_events,
    (SELECT COUNT(*) FROM clubes WHERE status = 'ativo') as active_clubs,
    (SELECT COUNT(*) FROM licencas WHERE status = 'ativa' AND data_validade > CURRENT_DATE) as valid_licenses,
    CURRENT_TIMESTAMP as last_updated;

COMMIT;