#!/bin/bash

echo "🚀 Configurando ambiente do Clube de Tiro..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

log "Verificando estrutura de pastas..."

# Criar pastas necessárias se não existirem
mkdir -p volumes/{postgres-data,redis-data,uploads,backups,logs}
mkdir -p nginx/ssl
mkdir -p database/{init,migrations,seeds}

log "Criando arquivo .env..."

# Criar .env se não existir
if [ ! -f .env ]; then
    cp .env.example .env
    log "Arquivo .env criado. IMPORTANTE: Edite o arquivo .env com suas configurações!"
else
    warn "Arquivo .env já existe. Verificando se está atualizado..."
fi

log "Gerando certificados SSL auto-assinados..."

# Gerar certificados SSL para desenvolvimento
if [ ! -f nginx/ssl/clube-tiro.crt ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/clube-tiro.key \
        -out nginx/ssl/clube-tiro.crt \
        -subj "/C=BR/ST=RS/L=Carazinho/O=ClubeTiro/CN=localhost"
    log "Certificados SSL gerados!"
else
    log "Certificados SSL já existem."
fi

log "Configurando permissões..."
chmod +x scripts/*.sh

log "Testando conexão Docker..."
if docker info >/dev/null 2>&1; then
    log "Docker está funcionando corretamente!"
else
    error "Problema com Docker. Verifique se o Docker está rodando."
    exit 1
fi

log "✅ Setup concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env com suas configurações"
echo "2. Execute: make dev"
echo "3. Acesse: http://localhost:3000 (Frontend)"
echo "4. API: http://localhost:3001/api (Backend)"
echo ""
echo "🆘 Comandos úteis:"
echo "  make help     - Ver todos os comandos"
echo "  make logs     - Ver logs em tempo real"
echo "  make status   - Status dos containers"
echo "  make backup   - Fazer backup do banco"
echo ""