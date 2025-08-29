-- Migration: Add member tracking fields to users table
-- Date: 2025-08-29
-- Description: Add fields to track member status and enable marketing analytics

-- Add member-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS associado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS data_associacao DATE,
ADD COLUMN IF NOT EXISTS status_associacao VARCHAR(20) 
  CHECK (status_associacao IN ('ativo', 'inativo', 'suspenso')) 
  DEFAULT 'ativo';

-- Create index for faster member queries
CREATE INDEX IF NOT EXISTS idx_users_associado ON users(associado);
CREATE INDEX IF NOT EXISTS idx_users_status_associacao ON users(status_associacao);

-- Create view for participation analytics
CREATE OR REPLACE VIEW participation_analytics AS
SELECT 
  u.id as user_id,
  u.nome,
  u.email,
  u.associado,
  u.telefone,
  u.data_associacao,
  u.status_associacao,
  COUNT(p.evento_id) as total_eventos,
  COUNT(CASE WHEN NOT u.associado THEN p.evento_id END) as eventos_como_nao_associado,
  COUNT(CASE WHEN u.associado THEN p.evento_id END) as eventos_como_associado,
  MAX(p.data_inscricao) as ultima_participacao,
  CASE 
    WHEN COUNT(p.evento_id) >= 5 THEN 'alta'
    WHEN COUNT(p.evento_id) >= 2 THEN 'media'
    ELSE 'baixa'
  END as frequencia_participacao,
  CASE 
    WHEN NOT u.associado AND COUNT(p.evento_id) >= 3 THEN 'alto'
    WHEN NOT u.associado AND COUNT(p.evento_id) >= 1 THEN 'medio'
    ELSE 'baixo'
  END as potencial_conversao
FROM users u
LEFT JOIN participantes p ON u.id = p.user_id
GROUP BY u.id, u.nome, u.email, u.associado, u.telefone, u.data_associacao, u.status_associacao;

-- Create view for marketing opportunities
CREATE OR REPLACE VIEW marketing_opportunities AS
SELECT 
  user_id,
  nome,
  email,
  telefone,
  total_eventos,
  eventos_como_nao_associado,
  ultima_participacao,
  potencial_conversao
FROM participation_analytics
WHERE 
  associado = false 
  AND total_eventos > 0 
  AND potencial_conversao IN ('alto', 'medio')
ORDER BY 
  CASE potencial_conversao 
    WHEN 'alto' THEN 1 
    WHEN 'medio' THEN 2 
    ELSE 3 
  END,
  total_eventos DESC;

-- Update existing users to have default member status
UPDATE users 
SET associado = false, status_associacao = 'ativo' 
WHERE associado IS NULL OR status_associacao IS NULL;