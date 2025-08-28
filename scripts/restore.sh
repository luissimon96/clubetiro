#!/bin/bash

BACKUP_DIR="./volumes/backups"
DB_CONTAINER="clube-tiro-postgres"

echo "♻️ Restaurando backup..."

# Listar backups disponíveis
echo "📋 Backups disponíveis:"
ls -la $BACKUP_DIR/database_*.sql | awk '{print NR". "$9}' | tail -5

echo ""
echo "Digite o número do backup que deseja restaurar (ou 'q' para sair):"
read -r choice

if [ "$choice" = "q" ]; then
    echo "Operação cancelada."
    exit 0
fi

# Selecionar arquivo de backup
BACKUP_FILE=$(ls -t $BACKUP_DIR/database_*.sql | sed -n "${choice}p")

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Backup não encontrado!"
    exit 1
fi

echo "📊 Restaurando backup: $BACKUP_FILE"

# Parar aplicação temporariamente
echo "⏸️ Parando containers da aplicação..."
docker-compose stop backend frontend

# Restaurar banco
echo "🔄 Restaurando banco de dados..."
docker exec -i $DB_CONTAINER psql -U clube_tiro_user -d clube_tiro_db < "$BACKUP_FILE"

# Reiniciar aplicação
echo "▶️ Reiniciando aplicação..."
docker-compose start backend frontend

echo "✅ Restore concluído!"