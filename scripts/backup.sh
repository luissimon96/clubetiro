#!/bin/bash

# Configurações
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./volumes/backups"
DB_CONTAINER="clube-tiro-postgres"

echo "💾 Iniciando backup em $DATE..."

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Backup do banco PostgreSQL
echo "📊 Fazendo backup do banco de dados..."
docker exec $DB_CONTAINER pg_dump -U clube_tiro_user clube_tiro_db > "$BACKUP_DIR/database_$DATE.sql"

# Backup dos uploads
echo "📁 Fazendo backup dos arquivos..."
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C ./volumes uploads/

# Backup dos logs (últimos 7 dias)
echo "📋 Fazendo backup dos logs..."
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" -C ./volumes logs/

# Limpar backups antigos (manter últimos 10)
echo "🧹 Limpando backups antigos..."
ls -t $BACKUP_DIR/database_*.sql | tail -n +11 | xargs -r rm
ls -t $BACKUP_DIR/uploads_*.tar.gz | tail -n +11 | xargs -r rm
ls -t $BACKUP_DIR/logs_*.tar.gz | tail -n +11 | xargs -r rm

echo "✅ Backup concluído!"
echo "📍 Arquivos salvos em: $BACKUP_DIR"
ls -la $BACKUP_DIR/*$DATE*