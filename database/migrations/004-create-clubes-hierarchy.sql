-- Migration: Create clubs hierarchy and licensing system (FIXED)
-- Date: 2025-08-31
-- Description: Implement hierarchical club management system (Fixed for existing columns)

-- Create clubes table (main entity for clubs)
CREATE TABLE IF NOT EXISTS clubes (
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
    
    -- Administrative information
    status VARCHAR(20) CHECK (status IN ('ativo', 'inativo', 'suspenso')) DEFAULT 'ativo',
    tipo VARCHAR(20) CHECK (tipo IN ('sede', 'filial', 'associado')) DEFAULT 'associado',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create licencas table for regulatory compliance
CREATE TABLE IF NOT EXISTS licencas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clube_id UUID NOT NULL REFERENCES clubes(id) ON DELETE CASCADE,
    
    -- License information
    numero_licenca VARCHAR(50) NOT NULL,
    tipo_licenca VARCHAR(50) NOT NULL, -- 'federal', 'estadual', 'municipal'
    orgao_expedidor VARCHAR(100) NOT NULL, -- 'Exército', 'Polícia Civil', etc.
    
    -- Dates
    data_emissao DATE NOT NULL,
    data_validade DATE NOT NULL,
    data_renovacao DATE,
    
    -- Status and compliance
    status VARCHAR(20) CHECK (status IN ('ativa', 'vencida', 'suspensa', 'cancelada')) DEFAULT 'ativa',
    observacoes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one license per club per month
    UNIQUE(clube_id, numero_licenca)
);

-- Create foreign key constraint for clube_id in users table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_clube_id_fkey'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_clube_id_fkey 
        FOREIGN KEY (clube_id) REFERENCES clubes(id);
    END IF;
END
$$;

-- Add clube_id to eventos table for club isolation (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eventos' AND column_name = 'clube_id'
    ) THEN
        ALTER TABLE eventos ADD COLUMN clube_id UUID REFERENCES clubes(id);
    END IF;
END
$$;

-- Add clube_id to mensalidades table for club member payments (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'mensalidades'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mensalidades' AND column_name = 'clube_id'
    ) THEN
        ALTER TABLE mensalidades ADD COLUMN clube_id UUID REFERENCES clubes(id);
    END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clubes_status ON clubes(status);
CREATE INDEX IF NOT EXISTS idx_clubes_tipo ON clubes(tipo);
CREATE INDEX IF NOT EXISTS idx_clubes_cnpj ON clubes(cnpj);

CREATE INDEX IF NOT EXISTS idx_licencas_clube ON licencas(clube_id);
CREATE INDEX IF NOT EXISTS idx_licencas_status ON licencas(status);
CREATE INDEX IF NOT EXISTS idx_licencas_validade ON licencas(data_validade);

-- Create trigger for updated_at
CREATE TRIGGER update_clubes_updated_at BEFORE UPDATE ON clubes
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_licencas_updated_at BEFORE UPDATE ON licencas
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create view for club hierarchy and status
CREATE OR REPLACE VIEW club_hierarchy_view AS
SELECT 
    c.id,
    c.nome,
    c.cnpj,
    c.cr,
    c.status as club_status,
    c.tipo as club_tipo,
    c.endereco,
    c.contato,
    COUNT(u.id) as total_members,
    COUNT(CASE WHEN u.associado = true THEN 1 END) as active_members,
    COUNT(l.id) as total_licenses,
    COUNT(CASE WHEN l.status = 'ativa' AND l.data_validade > CURRENT_DATE THEN 1 END) as valid_licenses,
    c.created_at,
    c.updated_at
FROM clubes c
LEFT JOIN users u ON c.id = u.clube_id
LEFT JOIN licencas l ON c.id = l.clube_id
GROUP BY c.id, c.nome, c.cnpj, c.cr, c.status, c.tipo, c.endereco, c.contato, c.created_at, c.updated_at;

-- Create view for license compliance monitoring
CREATE OR REPLACE VIEW license_compliance_view AS
SELECT 
    c.id as clube_id,
    c.nome as clube_nome,
    l.id as licenca_id,
    l.numero_licenca,
    l.tipo_licenca,
    l.orgao_expedidor,
    l.data_emissao,
    l.data_validade,
    l.status,
    CASE 
        WHEN l.data_validade <= CURRENT_DATE THEN 'VENCIDA'
        WHEN l.data_validade <= (CURRENT_DATE + INTERVAL '30 days') THEN 'VENCE_EM_30_DIAS'
        WHEN l.data_validade <= (CURRENT_DATE + INTERVAL '90 days') THEN 'VENCE_EM_90_DIAS'
        ELSE 'VIGENTE'
    END as situacao_validade,
    (l.data_validade - CURRENT_DATE) as dias_para_vencer
FROM clubes c
INNER JOIN licencas l ON c.id = l.clube_id
WHERE c.status = 'ativo'
ORDER BY l.data_validade ASC;

COMMIT;