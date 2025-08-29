-- Migration: Fix hierarchy implementation for existing database
-- Date: 2025-08-29
-- Description: Apply hierarchy fixes for existing database structure

-- Update user types constraint to support new hierarchy
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tipo_check;
ALTER TABLE users ADD CONSTRAINT users_tipo_check 
CHECK (tipo IN ('system_admin', 'club_admin', 'club_member', 'admin', 'comum'));

-- Update existing admin to system_admin
UPDATE users 
SET tipo = 'system_admin' 
WHERE email = 'admin@clubetiro.com' AND tipo = 'admin';

-- Create missing function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to new tables
DROP TRIGGER IF EXISTS update_clubes_updated_at ON clubes;
CREATE TRIGGER update_clubes_updated_at 
    BEFORE UPDATE ON clubes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clube_licencas_updated_at ON clube_licencas;
CREATE TRIGGER update_clube_licencas_updated_at 
    BEFORE UPDATE ON clube_licencas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS resultados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participante_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
    pontuacao INTEGER NOT NULL DEFAULT 0,
    tiros_realizados INTEGER DEFAULT 0,
    observacoes TEXT,
    posicao INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mensalidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    clube_id UUID REFERENCES clubes(id),
    mes INTEGER CHECK (mes BETWEEN 1 AND 12) NOT NULL,
    ano INTEGER CHECK (ano >= 2020) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')) DEFAULT 'pendente',
    metodo_pagamento VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mes, ano)
);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_resultados_participante ON resultados(participante_id);
CREATE INDEX IF NOT EXISTS idx_resultados_pontuacao ON resultados(pontuacao DESC);
CREATE INDEX IF NOT EXISTS idx_mensalidades_user ON mensalidades(user_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_clube ON mensalidades(clube_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_periodo ON mensalidades(ano, mes);
CREATE INDEX IF NOT EXISTS idx_mensalidades_status ON mensalidades(status);
CREATE INDEX IF NOT EXISTS idx_mensalidades_vencimento ON mensalidades(data_vencimento);

-- Add missing triggers
DROP TRIGGER IF EXISTS update_resultados_updated_at ON resultados;
CREATE TRIGGER update_resultados_updated_at 
    BEFORE UPDATE ON resultados 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mensalidades_updated_at ON mensalidades;
CREATE TRIGGER update_mensalidades_updated_at 
    BEFORE UPDATE ON mensalidades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user_sessions table if not exists
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- Insert sample clube for testing (if not exists)
INSERT INTO clubes (
    id,
    nome, 
    cnpj, 
    cr,
    endereco,
    contato,
    licenca
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Clube de Tiro Exemplo',
    '12.345.678/0001-90',
    'CR-001-2024',
    '{"logradouro": "Rua dos Atiradores", "numero": "123", "bairro": "Centro", "cidade": "São Paulo", "estado": "SP", "cep": "01000-000"}',
    '{"telefone": "(11) 99999-9999", "email": "contato@clubeexemplo.com", "responsavel": "João Silva"}',
    '{"status": "ativa", "dataVencimento": "2025-12-31", "valorMensal": 299.90, "plano": "basico"}'
) ON CONFLICT (id) DO NOTHING;

COMMIT;