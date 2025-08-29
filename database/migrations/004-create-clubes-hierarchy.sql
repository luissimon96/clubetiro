-- Migration: Create clubs hierarchy and licensing system
-- Date: 2025-08-29
-- Description: Implement hierarchical club management system

-- Create clubes table (main entity for clubs)
CREATE TABLE clubes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    cr VARCHAR(50) NOT NULL, -- Certificado de Registro
    
    -- Address information as JSONB for flexibility
    endereco JSONB NOT NULL,
    -- Expected structure: {
    --   "logradouro": "string",
    --   "numero": "string", 
    --   "complemento": "string?",
    --   "bairro": "string",
    --   "cidade": "string",
    --   "estado": "string",
    --   "cep": "string"
    -- }
    
    -- Contact information as JSONB
    contato JSONB NOT NULL,
    -- Expected structure: {
    --   "telefone": "string",
    --   "email": "string",
    --   "responsavel": "string"
    -- }
    
    -- License information as JSONB
    licenca JSONB NOT NULL,
    -- Expected structure: {
    --   "status": "ativa|suspensa|cancelada|pendente",
    --   "dataVencimento": "string (ISO date)",
    --   "valorMensal": number,
    --   "plano": "basico|intermediario|premium"
    -- }
    
    -- Stripe integration (for future payment processing)
    stripe_customer_id VARCHAR(100),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT true
);

-- Create clube_licencas table for tracking license payments
CREATE TABLE clube_licencas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clube_id UUID NOT NULL REFERENCES clubes(id) ON DELETE CASCADE,
    mes INTEGER CHECK (mes BETWEEN 1 AND 12) NOT NULL,
    ano INTEGER CHECK (ano >= 2024) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')) DEFAULT 'pendente',
    
    -- Stripe integration
    stripe_payment_intent_id VARCHAR(100),
    metodo_pagamento VARCHAR(50),
    observacoes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one license per club per month
    UNIQUE(clube_id, mes, ano)
);

-- Modify users table to support club hierarchy
ALTER TABLE users 
ADD COLUMN clube_id UUID REFERENCES clubes(id),
ADD COLUMN numero_registro VARCHAR(50),
ADD COLUMN permissoes JSONB;

-- Update user types to support new hierarchy
ALTER TABLE users DROP CONSTRAINT users_tipo_check;
ALTER TABLE users ADD CONSTRAINT users_tipo_check 
CHECK (tipo IN ('system_admin', 'club_admin', 'club_member', 'admin', 'comum'));

-- Add clube_id to eventos table for club isolation
ALTER TABLE eventos ADD COLUMN clube_id UUID REFERENCES clubes(id);

-- Add clube_id to mensalidades table for club member payments
ALTER TABLE mensalidades ADD COLUMN clube_id UUID REFERENCES clubes(id);

-- Create indexes for performance
CREATE INDEX idx_clubes_cnpj ON clubes(cnpj);
CREATE INDEX idx_clubes_ativo ON clubes(ativo);
CREATE INDEX idx_clubes_nome ON clubes(nome);

CREATE INDEX idx_clube_licencas_clube ON clube_licencas(clube_id);
CREATE INDEX idx_clube_licencas_periodo ON clube_licencas(ano, mes);
CREATE INDEX idx_clube_licencas_status ON clube_licencas(status);
CREATE INDEX idx_clube_licencas_vencimento ON clube_licencas(data_vencimento);

CREATE INDEX idx_users_clube ON users(clube_id);
CREATE INDEX idx_users_tipo_clube ON users(tipo, clube_id);

CREATE INDEX idx_eventos_clube ON eventos(clube_id);
CREATE INDEX idx_mensalidades_clube ON mensalidades(clube_id);

-- Add updated_at trigger to new tables
CREATE TRIGGER update_clubes_updated_at 
    BEFORE UPDATE ON clubes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clube_licencas_updated_at 
    BEFORE UPDATE ON clube_licencas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for data isolation
-- Enable RLS on main tables
ALTER TABLE clubes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE clube_licencas ENABLE ROW LEVEL SECURITY;

-- Policies for clubes table
CREATE POLICY clubes_system_admin_all ON clubes
    FOR ALL TO authenticated
    USING (current_setting('app.user_type', true) = 'system_admin');

CREATE POLICY clubes_club_admin_own ON clubes
    FOR SELECT TO authenticated
    USING (
        current_setting('app.user_type', true) IN ('club_admin', 'club_member') 
        AND id = current_setting('app.user_club_id', true)::uuid
    );

-- Policies for eventos table  
CREATE POLICY eventos_system_admin_all ON eventos
    FOR ALL TO authenticated
    USING (current_setting('app.user_type', true) = 'system_admin');

CREATE POLICY eventos_club_users ON eventos
    FOR ALL TO authenticated
    USING (
        current_setting('app.user_type', true) IN ('club_admin', 'club_member')
        AND (clube_id IS NULL OR clube_id = current_setting('app.user_club_id', true)::uuid)
    );

-- Policies for participantes table
CREATE POLICY participantes_system_admin_all ON participantes
    FOR ALL TO authenticated
    USING (current_setting('app.user_type', true) = 'system_admin');

CREATE POLICY participantes_club_users ON participantes
    FOR ALL TO authenticated
    USING (
        current_setting('app.user_type', true) IN ('club_admin', 'club_member')
        AND EXISTS (
            SELECT 1 FROM eventos e 
            WHERE e.id = evento_id 
            AND (e.clube_id IS NULL OR e.clube_id = current_setting('app.user_club_id', true)::uuid)
        )
    );

-- Policies for resultados table
CREATE POLICY resultados_system_admin_all ON resultados
    FOR ALL TO authenticated
    USING (current_setting('app.user_type', true) = 'system_admin');

CREATE POLICY resultados_club_users ON resultados
    FOR ALL TO authenticated
    USING (
        current_setting('app.user_type', true) IN ('club_admin', 'club_member')
        AND EXISTS (
            SELECT 1 FROM participantes p
            JOIN eventos e ON p.evento_id = e.id
            WHERE p.id = participante_id 
            AND (e.clube_id IS NULL OR e.clube_id = current_setting('app.user_club_id', true)::uuid)
        )
    );

-- Policies for mensalidades table
CREATE POLICY mensalidades_system_admin_all ON mensalidades
    FOR ALL TO authenticated
    USING (current_setting('app.user_type', true) = 'system_admin');

CREATE POLICY mensalidades_club_users ON mensalidades
    FOR ALL TO authenticated
    USING (
        current_setting('app.user_type', true) IN ('club_admin', 'club_member')
        AND (clube_id IS NULL OR clube_id = current_setting('app.user_club_id', true)::uuid)
    );

-- Policies for clube_licencas table
CREATE POLICY clube_licencas_system_admin_all ON clube_licencas
    FOR ALL TO authenticated
    USING (current_setting('app.user_type', true) = 'system_admin');

CREATE POLICY clube_licencas_club_admin ON clube_licencas
    FOR SELECT TO authenticated
    USING (
        current_setting('app.user_type', true) = 'club_admin'
        AND clube_id = current_setting('app.user_club_id', true)::uuid
    );

-- Create a default system admin user (update existing admin to system_admin)
UPDATE users 
SET tipo = 'system_admin' 
WHERE email = 'admin@clubetiro.com';

-- Create sample clube for testing
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
);

COMMIT;