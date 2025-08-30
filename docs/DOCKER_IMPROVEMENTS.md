# 🐳 Docker Configuration Improvements

Este documento detalha todas as melhorias implementadas na configuração Docker do sistema Clube de Tiro.

## 📋 Resumo das Melhorias

✅ **Desenvolvimento aprimorado** - Dockerfile específico com hot-reload otimizado  
✅ **Configuração de ambiente completa** - Template .env.example com todas as opções  
✅ **Nginx otimizado** - Configuração para Nuxt.js SSR com segurança  
✅ **Monitoramento completo** - Prometheus + Grafana + métricas  
✅ **Redis persistente** - Configuração otimizada para produção  
✅ **Backup robusto** - Script com error handling e notificações  
✅ **Segurança aprimorada** - Headers, rate limiting e SSL

---

## 🛠️ Arquivos Criados/Modificados

### Novos Arquivos
- `Dockerfile.dev` - Container de desenvolvimento com hot-reload
- `.env.example` - Template de configuração com segurança
- `monitoring/prometheus.yml` - Configuração do Prometheus
- `monitoring/grafana/provisioning/datasources/datasources.yml` - Datasources do Grafana

### Arquivos Modificados
- `docker-compose.yml` - Desenvolvimento otimizado
- `docker-compose.prod.yml` - Produção com monitoramento
- `nginx/nginx.prod.conf` - Nginx otimizado para Nuxt.js
- `scripts/backup.sh` - Backup com error handling avançado

---

## 🚀 Como Usar

### Desenvolvimento
```bash
# 1. Copiar configurações de ambiente
cp .env.example .env

# 2. Editar .env com suas configurações
nano .env

# 3. Iniciar ambiente de desenvolvimento
docker-compose up -d

# 4. Verificar logs
docker-compose logs -f nuxt-app
```

### Produção
```bash
# 1. Configurar ambiente de produção
cp .env.example .env.production
nano .env.production

# 2. Iniciar ambiente de produção
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 3. Verificar status dos serviços
docker-compose -f docker-compose.prod.yml ps
```

---

## 📊 Monitoramento

### Serviços Disponíveis
- **Grafana**: http://localhost:3001 (admin/admin_change_this)
- **Prometheus**: http://localhost:9090
- **cAdvisor**: http://localhost:8080
- **Aplicação**: https://localhost (com SSL)

### Métricas Coletadas
- ✅ Sistema operacional (CPU, RAM, Disco)
- ✅ Containers Docker (uso de recursos)
- ✅ Aplicação Nuxt.js (se implementado endpoint /api/metrics)
- ✅ PostgreSQL (se postgres_exporter for adicionado)
- ✅ Redis (se redis_exporter for adicionado)

---

## 🔐 Segurança Implementada

### Nginx Security Headers
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: no-referrer-when-downgrade`
- ✅ `Content-Security-Policy`
- ✅ `Strict-Transport-Security` (HTTPS)

### Rate Limiting
- ✅ API geral: 10 req/s com burst de 20
- ✅ Login/Auth: 1 req/s com burst de 5
- ✅ Proteção contra DDoS básico

### SSL/TLS
- ✅ TLS 1.2 e 1.3 apenas
- ✅ Ciphers seguros
- ✅ OCSP Stapling
- ✅ Session security

---

## 💾 Sistema de Backup

### Recursos do Script Aprimorado
- ✅ **Error handling robusto** - Falha rápida com logs detalhados
- ✅ **Verificação de integridade** - Testa arquivos criados
- ✅ **Notificações** - Webhook/Slack para sucesso/erro
- ✅ **Compressão** - Backups comprimidos para economia de espaço
- ✅ **Retenção automática** - Remove backups antigos automaticamente
- ✅ **Health checks** - Verifica saúde dos containers antes do backup
- ✅ **Logging completo** - Logs detalhados com timestamps
- ✅ **Monitoramento de espaço** - Alerta quando disco fica cheio

### Configuração de Notificações
Adicione ao `.env`:
```env
BACKUP_WEBHOOK_URL=https://seu-webhook.com/backup
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
BACKUP_RETENTION_DAYS=30
```

---

## ⚡ Performance Otimizada

### Nginx
- ✅ HTTP/2 habilitado
- ✅ Gzip compression otimizado
- ✅ Cache de assets estáticos (1 ano)
- ✅ Keepalive connections
- ✅ Worker processes otimizados

### Redis
- ✅ Persistência AOF + RDB
- ✅ Rewrite automático do AOF
- ✅ Política de eviction configurada
- ✅ Limites de memória definidos

### PostgreSQL
- ✅ Shared buffers otimizados
- ✅ Work memory configurado
- ✅ Effective cache size definido
- ✅ Max connections limitado

### Nuxt.js
- ✅ Build multi-stage otimizado
- ✅ Node.js memory limits
- ✅ Usuário não-root por segurança
- ✅ Health checks implementados
- ✅ Signal handling correto

---

## 🔧 Desenvolvimento

### Hot-Reload Inteligente
- ✅ **Monta apenas arquivos fonte** - Evita conflitos com node_modules
- ✅ **Build dentro do container** - Consistência entre ambientes
- ✅ **Dockerfile dedicado** - Otimizado para desenvolvimento
- ✅ **Volumes seletivos** - Apenas diretórios necessários

### Estrutura de Volumes (Desenvolvimento)
```yaml
volumes:
  - ./pages:/app/pages
  - ./components:/app/components
  - ./composables:/app/composables
  - ./server:/app/server
  - ./models:/app/models
  - ./middleware:/app/middleware
  - ./layouts:/app/layouts
  - ./assets:/app/assets
  - ./public:/app/public
  # Arquivos de configuração
  - ./nuxt.config.ts:/app/nuxt.config.ts
  - ./tailwind.config.js:/app/tailwind.config.js
  - ./tsconfig.json:/app/tsconfig.json
```

---

## 📈 Próximos Passos Recomendados

### Implementações Futuras
- [ ] **Postgres Exporter** - Métricas detalhadas do banco
- [ ] **Redis Exporter** - Métricas detalhadas do cache
- [ ] **Nginx Exporter** - Métricas do proxy reverso
- [ ] **Jaeger Tracing** - Distributed tracing
- [ ] **ELK Stack** - Logs centralizados
- [ ] **Vault** - Gerenciamento de secrets
- [ ] **Backup para S3** - Armazenamento em nuvem
- [ ] **Multi-stage CI/CD** - Pipeline automatizado

### Health Checks Adicionais
- [ ] **Database connectivity** - Verificar conexão DB
- [ ] **Redis connectivity** - Verificar conexão cache
- [ ] **External APIs** - Verificar dependências externas
- [ ] **Disk space monitoring** - Alertas automáticos

---

## 🆘 Troubleshooting

### Problemas Comuns

#### Container não inicia
```bash
# Verificar logs
docker-compose logs nome-do-servico

# Verificar configurações
docker-compose config
```

#### Permissões de arquivo
```bash
# Dar permissão ao script de backup
chmod +x scripts/backup.sh

# Verificar ownership dos volumes
docker-compose exec nuxt-app ls -la /app
```

#### SSL/TLS Issues
```bash
# Verificar certificados
ls -la nginx/ssl/

# Testar configuração nginx
docker-compose exec nginx nginx -t
```

#### Performance Issues
```bash
# Verificar recursos
docker stats

# Verificar logs de erro
docker-compose logs | grep -i error
```

---

## 📚 Documentação de Referência

### Links Úteis
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Prometheus Configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [PostgreSQL Optimization](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Configuration](https://redis.io/docs/manual/config/)

### Configurações de Segurança
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Mozilla SSL Configuration](https://ssl-config.mozilla.org/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

---

*Documentação atualizada em: $(date +'%Y-%m-%d')*  
*Versão: 1.0.0*  
*Autor: Claude Code Assistant*