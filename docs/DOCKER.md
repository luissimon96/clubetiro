# 🐳 Docker Setup - Sistema Clube de Tiro

Este documento contém as instruções para executar o sistema usando Docker.

## 📋 Pré-requisitos

- Docker 20.x+
- Docker Compose 2.x+
- Git

## 🚀 Início Rápido

### 1. Configuração do Ambiente

```bash
# Clone o repositório
git clone <repository-url>
cd clubetiro

# Copie e configure as variáveis de ambiente
cp .env.example .env

# IMPORTANTE: Edite o arquivo .env com suas configurações
nano .env
```

### 2. Desenvolvimento

```bash
# Subir todos os serviços em modo desenvolvimento
docker-compose up -d

# Verificar logs
docker-compose logs -f nuxt-app

# Acessar a aplicação
# Frontend: http://localhost:3000
# Banco: localhost:5432
# Redis: localhost:6379
```

### 3. Produção

```bash
# Subir em modo produção
docker-compose -f docker-compose.prod.yml up -d

# Verificar status dos serviços
docker-compose -f docker-compose.prod.yml ps

# Acessar a aplicação
# Frontend: http://localhost (porta 80)
# HTTPS: https://localhost (porta 443)
```

## 🏗️ Arquitetura do Sistema

### Desenvolvimento (`docker-compose.yml`)
- **nuxt-app**: Aplicação Nuxt.js com hot reload
- **postgres**: Banco PostgreSQL 15
- **redis**: Cache Redis 7

### Produção (`docker-compose.prod.yml`)
- **nuxt-app**: Aplicação Nuxt.js otimizada
- **postgres**: Banco PostgreSQL 15 com tuning
- **redis**: Cache Redis 7 com configurações de produção
- **nginx**: Proxy reverso com SSL
- **backup**: Backup automático do banco

## 📁 Estrutura de Volumes

```
volumes/
├── postgres-data/    # Dados do PostgreSQL
├── redis-data/       # Dados do Redis
├── uploads/          # Arquivos enviados
├── logs/            # Logs da aplicação
└── backups/         # Backups automáticos
```

## 🛠️ Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status dos serviços
docker-compose ps

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO!)
docker-compose down -v

# Rebuild da aplicação
docker-compose build nuxt-app
docker-compose up -d nuxt-app

# Ver logs em tempo real
docker-compose logs -f

# Executar comando dentro do container
docker-compose exec nuxt-app npm run build
```

### Banco de Dados

```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U clube_tiro_user -d clube_tiro_db

# Fazer backup manual
docker-compose exec postgres pg_dump -U clube_tiro_user clube_tiro_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U clube_tiro_user clube_tiro_db < backup.sql
```

### Monitoramento

```bash
# Ver uso de recursos
docker stats

# Verificar health checks
docker-compose ps
docker inspect <container_name> | grep -A 20 Health

# Limpar dados não utilizados
docker system prune -a
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente Importantes

```env
# Produção
NODE_ENV=production
NUXT_SECRET_KEY=<chave-forte-64-chars>
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# Desenvolvimento
NODE_ENV=development
NUXT_PORT=3000
POSTGRES_PORT=5432
```

### Otimizações de Performance

#### PostgreSQL (Produção)
```sql
-- Configurações aplicadas automaticamente
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
max_connections = 200
```

#### Redis (Produção)
```
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
```

#### Nuxt.js (Produção)
```typescript
// Configurações no nuxt.config.ts
nitro: {
  minify: true,
  compressPublicAssets: true,
  preset: 'node-server'
}
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Porta já em uso
```bash
# Verificar o que está usando a porta
netstat -tulpn | grep :3000

# Parar processo
sudo kill -9 <PID>
```

#### 2. Permissões de volume
```bash
# Corrigir permissões
sudo chown -R $USER:$USER volumes/
```

#### 3. Memória insuficiente
```bash
# Aumentar limite do Node.js
export NODE_OPTIONS="--max-old-space-size=2048"
```

#### 4. Build falha
```bash
# Limpar cache do Docker
docker builder prune -a

# Rebuild sem cache
docker-compose build --no-cache
```

### Health Checks

A aplicação possui health checks configurados:

```bash
# Verificar health da aplicação
curl http://localhost:3000/api/health

# Response esperado
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

## 🔐 Segurança

### Checklist de Produção

- [ ] Alterar todas as senhas padrão
- [ ] Gerar chaves secretas fortes
- [ ] Configurar SSL/HTTPS
- [ ] Restringir portas expostas
- [ ] Configurar firewall
- [ ] Habilitar backup automático
- [ ] Monitorar logs de segurança

### Backup e Restore

```bash
# Backup automático (configurado no docker-compose.prod.yml)
# Executa diariamente às 2:00 AM

# Backup manual
docker-compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore
gunzip < backup_file.sql.gz | docker-compose exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB
```

## 📊 Monitoramento

Para produção, considere adicionar:

- **Prometheus + Grafana**: Métricas de performance
- **ELK Stack**: Centralização de logs
- **Uptime monitoring**: Monitoramento de disponibilidade
- **APM**: Application Performance Monitoring

## 🚀 Deploy em Cloud

### AWS ECS
```yaml
# Usar docker-compose.prod.yml como base
# Adicionar configurações específicas do ECS
```

### Google Cloud Run
```bash
# Build e push para GCR
docker build -t gcr.io/PROJECT_ID/clube-tiro .
docker push gcr.io/PROJECT_ID/clube-tiro

# Deploy
gcloud run deploy --image gcr.io/PROJECT_ID/clube-tiro
```

### DigitalOcean App Platform
```yaml
# Usar o Dockerfile diretamente
# Configurar variáveis de ambiente no painel
```

## 📞 Suporte

Para problemas relacionados ao Docker:

1. Verificar logs: `docker-compose logs`
2. Verificar health checks: `docker-compose ps`
3. Verificar recursos: `docker stats`
4. Consultar documentação oficial do Docker