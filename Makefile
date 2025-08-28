# Variáveis
COMPOSE_FILE=docker-compose.yml
COMPOSE_FILE_PROD=docker-compose.prod.yml

# Comandos de desenvolvimento
.PHONY: help setup dev stop clean logs status backup restore build prod

help: ## Mostra esta ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Setup inicial completo
	@echo "🚀 Configurando ambiente..."
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

dev: ## Inicia ambiente de desenvolvimento
	@echo "🔧 Iniciando desenvolvimento..."
	@docker-compose -f $(COMPOSE_FILE) up --build

dev-d: ## Inicia desenvolvimento em background
	@echo "🔧 Iniciando desenvolvimento (background)..."
	@docker-compose -f $(COMPOSE_FILE) up -d --build

stop: ## Para todos os containers
	@echo "⏹️ Parando containers..."
	@docker-compose -f $(COMPOSE_FILE) down

clean: ## Limpeza completa (cuidado: remove volumes)
	@echo "🧹 Limpando tudo..."
	@docker-compose -f $(COMPOSE_FILE) down -v
	@docker system prune -f

logs: ## Mostra logs em tempo real
	@docker-compose -f $(COMPOSE_FILE) logs -f

status: ## Status dos containers
	@docker-compose -f $(COMPOSE_FILE) ps

backup: ## Faz backup do banco de dados
	@echo "💾 Fazendo backup..."
	@./scripts/backup.sh

restore: ## Restaura backup do banco de dados
	@echo "♻️ Restaurando backup..."
	@./scripts/restore.sh

build: ## Build das imagens sem cache
	@docker-compose -f $(COMPOSE_FILE) build --no-cache

# Comandos de produção
prod: ## Inicia em modo produção
	@echo "🚀 Iniciando produção..."
	@docker-compose -f $(COMPOSE_FILE_PROD) up -d --build

prod-stop: ## Para produção
	@echo "⏹️ Parando produção..."
	@docker-compose -f $(COMPOSE_FILE_PROD) down

prod-logs: ## Logs da produção
	@docker-compose -f $(COMPOSE_FILE_PROD) logs -f

# Comandos de manutenção
migrate: ## Executa migrations do banco
	@echo "🗃️ Executando migrations..."
	@docker-compose -f $(COMPOSE_FILE) exec backend npm run migrate

seed: ## Executa seeds do banco
	@echo "🌱 Executando seeds..."
	@docker-compose -f $(COMPOSE_FILE) exec backend npm run seed

shell-backend: ## Acesso shell do backend
	@docker-compose -f $(COMPOSE_FILE) exec backend sh

shell-frontend: ## Acesso shell do frontend
	@docker-compose -f $(COMPOSE_FILE) exec frontend sh

shell-db: ## Acesso ao PostgreSQL
	@docker-compose -f $(COMPOSE_FILE) exec postgres psql -U clube_tiro_user -d clube_tiro_db