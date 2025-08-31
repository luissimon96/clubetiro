-- Migration: Initial database schema
-- Date: 2025-08-31
-- Description: Create initial database schema with all core tables

-- Set timezone
SET TIME ZONE 'America/Sao_Paulo';

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('admin', 'comum')) DEFAULT 'comum',
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_evento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME,
    local VARCHAR(200),
    max_participantes INTEGER,
    valor_inscricao DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) CHECK (status IN ('planejado', 'inscricoes_abertas', 'em_andamento', 'finalizado', 'cancelado')) DEFAULT 'planejado',
    criado_por UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Participants table
CREATE TABLE IF NOT EXISTS participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('inscrito', 'presente', 'ausente', 'cancelado')) DEFAULT 'inscrito',
    valor_pago DECIMAL(10,2) DEFAULT 0.00,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(evento_id, user_id)
);

-- Results table
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

-- Monthly fees table
CREATE TABLE IF NOT EXISTS mensalidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
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

-- User sessions table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tipo ON users(tipo);
CREATE INDEX IF NOT EXISTS idx_users_ativo ON users(ativo);

CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos(status);
CREATE INDEX IF NOT EXISTS idx_eventos_criado_por ON eventos(criado_por);

CREATE INDEX IF NOT EXISTS idx_participantes_evento ON participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_participantes_user ON participantes(user_id);
CREATE INDEX IF NOT EXISTS idx_participantes_status ON participantes(status);

CREATE INDEX IF NOT EXISTS idx_resultados_participante ON resultados(participante_id);
CREATE INDEX IF NOT EXISTS idx_resultados_pontuacao ON resultados(pontuacao DESC);

CREATE INDEX IF NOT EXISTS idx_mensalidades_user ON mensalidades(user_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_periodo ON mensalidades(ano, mes);
CREATE INDEX IF NOT EXISTS idx_mensalidades_status ON mensalidades(status);
CREATE INDEX IF NOT EXISTS idx_mensalidades_vencimento ON mensalidades(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- Create triggers for updated_at automation
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eventos_updated_at ON eventos;
CREATE TRIGGER update_eventos_updated_at 
    BEFORE UPDATE ON eventos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_participantes_updated_at ON participantes;
CREATE TRIGGER update_participantes_updated_at 
    BEFORE UPDATE ON participantes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resultados_updated_at ON resultados;
CREATE TRIGGER update_resultados_updated_at 
    BEFORE UPDATE ON resultados 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mensalidades_updated_at ON mensalidades;
CREATE TRIGGER update_mensalidades_updated_at 
    BEFORE UPDATE ON mensalidades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Hash generated with: bcrypt.hashSync('admin123', 12)
INSERT INTO users (id, nome, email, senha_hash, tipo) VALUES 
('00000000-0000-0000-0000-000000000001', 'Administrador', 'admin@clubetiro.com', '$2a$12$tUXqvQ1r4qmzuebft3qHFeGrdrz6jY/v5TFYAEcmKF..AP.H4aJKy', 'admin')
ON CONFLICT (email) DO NOTHING;

COMMIT;