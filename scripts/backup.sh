#!/bin/bash
set -euo pipefail

# ========================================
# Clube de Tiro - Enhanced Backup Script
# ========================================

# Configurações
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_CONTAINER="clube-tiro-postgres-prod"
DB_NAME="${POSTGRES_DB:-clube_tiro_db}"
DB_USER="${POSTGRES_USER:-clube_tiro_user}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-10}"
LOG_FILE="$BACKUP_DIR/backup.log"

# Configurações de notificação
WEBHOOK_URL="${BACKUP_WEBHOOK_URL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para logging
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Função para error handling
handle_error() {
    local exit_code=$1
    local line_number=$2
    log "ERROR" "Script failed with exit code $exit_code at line $line_number"
    send_notification "❌ Backup Failed" "Backup falhou no line $line_number com código $exit_code"
    exit $exit_code
}

# Função para enviar notificações
send_notification() {
    local title="$1"
    local message="$2"
    
    # Webhook genérico
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"title\":\"$title\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" || true
    fi
    
    # Slack webhook
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$title: $message\"}" || true
    fi
}

# Função para verificar saúde do container
check_container_health() {
    local container=$1
    if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*healthy"; then
        log "ERROR" "Container $container não está saudável"
        return 1
    fi
    return 0
}

# Função para calcular tamanho de arquivo
get_file_size() {
    local file=$1
    if [ -f "$file" ]; then
        du -h "$file" | cut -f1
    else
        echo "0B"
    fi
}

# Setup error handling
trap 'handle_error $? $LINENO' ERR

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Inicializar log
log "INFO" "🚀 Iniciando backup em $DATE..."

# Verificar se containers estão rodando
log "INFO" "🔍 Verificando saúde dos containers..."
check_container_health "$DB_CONTAINER"

# Backup do banco PostgreSQL
log "INFO" "📊 Iniciando backup do banco de dados..."
DB_BACKUP_FILE="$BACKUP_DIR/database_$DATE.sql"

if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$DB_BACKUP_FILE"; then
    DB_SIZE=$(get_file_size "$DB_BACKUP_FILE")
    log "INFO" "✅ Backup do banco concluído ($DB_SIZE)"
else
    log "ERROR" "❌ Falha no backup do banco de dados"
    exit 1
fi

# Comprimir backup do banco
log "INFO" "🗜️ Comprimindo backup do banco..."
if gzip "$DB_BACKUP_FILE"; then
    COMPRESSED_DB_SIZE=$(get_file_size "$DB_BACKUP_FILE.gz")
    log "INFO" "✅ Backup comprimido ($COMPRESSED_DB_SIZE)"
else
    log "ERROR" "❌ Falha na compressão do backup"
    exit 1
fi

# Backup dos uploads (se existir)
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_$DATE.tar.gz"
if [ -d "/app/uploads" ] && [ "$(ls -A /app/uploads 2>/dev/null)" ]; then
    log "INFO" "📁 Fazendo backup dos arquivos..."
    if tar -czf "$UPLOADS_BACKUP_FILE" -C /app uploads/; then
        UPLOADS_SIZE=$(get_file_size "$UPLOADS_BACKUP_FILE")
        log "INFO" "✅ Backup dos uploads concluído ($UPLOADS_SIZE)"
    else
        log "WARN" "⚠️ Falha no backup dos uploads"
    fi
else
    log "INFO" "📁 Nenhum arquivo de upload encontrado"
fi

# Backup dos logs (se existir)
LOGS_BACKUP_FILE="$BACKUP_DIR/logs_$DATE.tar.gz"
if [ -d "/app/logs" ] && [ "$(ls -A /app/logs 2>/dev/null)" ]; then
    log "INFO" "📋 Fazendo backup dos logs..."
    if tar -czf "$LOGS_BACKUP_FILE" -C /app logs/; then
        LOGS_SIZE=$(get_file_size "$LOGS_BACKUP_FILE")
        log "INFO" "✅ Backup dos logs concluído ($LOGS_SIZE)"
    else
        log "WARN" "⚠️ Falha no backup dos logs"
    fi
else
    log "INFO" "📋 Nenhum arquivo de log encontrado"
fi

# Limpeza de backups antigos
log "INFO" "🧹 Limpando backups antigos (mantendo últimos $RETENTION_DAYS)..."

cleanup_old_backups() {
    local pattern=$1
    local count=$(ls -t $BACKUP_DIR/$pattern 2>/dev/null | wc -l)
    if [ "$count" -gt "$RETENTION_DAYS" ]; then
        local to_delete=$(( count - RETENTION_DAYS ))
        log "INFO" "🗑️ Removendo $to_delete arquivos antigos ($pattern)"
        ls -t $BACKUP_DIR/$pattern | tail -n +$(( RETENTION_DAYS + 1 )) | xargs -r rm -f
    fi
}

cleanup_old_backups "database_*.sql.gz"
cleanup_old_backups "uploads_*.tar.gz"
cleanup_old_backups "logs_*.tar.gz"

# Verificar integridade dos backups criados
log "INFO" "🔍 Verificando integridade dos backups..."
TOTAL_SIZE=0

for file in "$DB_BACKUP_FILE.gz" "$UPLOADS_BACKUP_FILE" "$LOGS_BACKUP_FILE"; do
    if [ -f "$file" ]; then
        if gzip -t "$file" 2>/dev/null || tar -tzf "$file" >/dev/null 2>&1; then
            file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
            TOTAL_SIZE=$((TOTAL_SIZE + file_size))
            log "INFO" "✅ $(basename "$file") está íntegro"
        else
            log "ERROR" "❌ $(basename "$file") está corrompido"
            exit 1
        fi
    fi
done

# Calcular espaço disponível
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4*1024}')
USED_PERCENTAGE=$(df "$BACKUP_DIR" | awk 'NR==2 {print substr($5, 1, length($5)-1)}')

log "INFO" "💾 Espaço usado: $(( TOTAL_SIZE / 1024 / 1024 ))MB"
log "INFO" "💾 Espaço disponível: $(( AVAILABLE_SPACE / 1024 / 1024 ))MB"
log "INFO" "💾 Percentual usado: ${USED_PERCENTAGE}%"

# Alerta se espaço em disco baixo
if [ "$USED_PERCENTAGE" -gt 85 ]; then
    log "WARN" "⚠️ Espaço em disco baixo (${USED_PERCENTAGE}%)"
    send_notification "⚠️ Backup Warning" "Espaço em disco baixo: ${USED_PERCENTAGE}% usado"
fi

# Resumo final
DURATION=$(($(date +%s) - $(date -d "$DATE" +%s 2>/dev/null || echo $(date +%s))))
log "INFO" "✅ Backup concluído com sucesso!"
log "INFO" "📍 Duração: ${DURATION}s"
log "INFO" "📍 Arquivos criados:"
ls -lah $BACKUP_DIR/*$DATE* 2>/dev/null | while read line; do
    log "INFO" "  $line"
done

# Enviar notificação de sucesso
send_notification "✅ Backup Success" "Backup concluído em ${DURATION}s. Tamanho total: $(( TOTAL_SIZE / 1024 / 1024 ))MB"

log "INFO" "🎉 Processo de backup finalizado com sucesso!"