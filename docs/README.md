# 🎯 Clube de Tiro Esportivo - Docker Setup

Sistema completo de gerenciamento de clube de tiro esportivo containerizado com Docker.

## 🚀 Início Rápido

```bash
# 1. Clone ou crie o projeto
git clone <seu-repositorio> clube-tiro-docker
cd clube-tiro-docker

# 2. Setup inicial completo
make setup

# 3. Editar configurações
# Edite o arquivo .env com suas configurações específicas

# 4. Iniciar desenvolvimento
make dev
```

## 📋 Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Comandos Principais

```bash
make help          # Ver todos os comandos disponíveis
make dev            # Iniciar desenvolvimento
make dev-d          # Iniciar em background
make stop           # Parar containers
make logs           # Ver logs em tempo real
make status         # Status dos containers
make backup         # Backup do banco de dados
make clean          # Limpeza completa (remove volumes)
```

## 🏗️ Estrutura do Projeto

```
clube-tiro-docker/
├── backend/                 # API Node.js + Express
│   ├── src/
│   ├── Dockerfile
│   └── Dockerfile.prod
├── frontend/                # React App
│   ├── src/
│   ├── Dockerfile
│   └── Dockerfile.prod
├── database/
│   └── init/               # Scripts de inicialização
├── nginx/                  # Configuração do proxy
├── scripts/                # Scripts de automação
├── volumes/                # Dados persistentes
│   ├── postgres-data/
│   ├── redis-data/
│   ├── uploads/
│   ├── backups/
│   └── logs/
├── docker-compose.yml      # Desenvolvimento
├── docker-compose.prod.yml # Produção
├── .env                    # Variáveis de ambiente
└── Makefile               # Comandos de automação
```

## 📦 Tecnologias

- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Frontend**: React, Tailwind CSS
- **Infraestrutura**: Docker, Nginx, SSL
- **Banco**: PostgreSQL 15 com extensões

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# Database
POSTGRES_DB=clube_tiro_db
POSTGRES_USER=clube_tiro_user
POSTGRES_PASSWORD=sua_senha_forte

# JWT
JWT_SECRET=sua_chave_secreta_de_32_caracteres

# API
API_URL=http://localhost:3001/api

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seuemail@gmail.com
EMAIL_PASS=senha_do_app
```

## 🏃‍♂️ Desenvolvimento

```bash
# Iniciar ambiente de desenvolvimento
make dev

# Ver logs em tempo real
make logs

# Acessar shell do backend
make shell-backend

# Acessar banco de dados
make shell-db

# Executar migrations
make migrate

# Executar seeds
make seed
```

## 🚀 Produção

```bash
# Iniciar em produção (com HTTPS)
make prod

# Parar produção
make prod-stop

# Ver logs de produção
make prod-logs
```

## 💾 Backup e Restore

```bash
# Fazer backup automático
make backup

# Restaurar backup (interativo)
make restore
```

## 🔒 SSL/HTTPS

O setup gera automaticamente certificados SSL auto-assinados para desenvolvimento. Para produção, substitua os certificados em `nginx/ssl/`.

## 🆘 Solução de Problemas

### Container não inicia
```bash
make logs              # Ver logs detalhados
make build             # Reconstruir imagens
make clean && make dev # Limpeza completa
```

### Problemas de permissão
```bash
chmod +x scripts/*.sh  # Dar permissão aos scripts
```

### Banco não conecta
```bash
make shell-db          # Acessar PostgreSQL diretamente
docker-compose exec postgres pg_isready
```

## 📝 To-Do / Próximas Features

- [ ] Implementar sistema de autenticação
- [ ] Adicionar módulo de cadastro de atiradores
- [ ] Sistema de controle de competições
- [ ] Dashboard com estatísticas
- [ ] Sistema de backup automático
- [ ] Monitoramento com Prometheus
- [ ] CI/CD Pipeline

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

Desenvolvido para o gerenciamento eficiente de clubes de tiro esportivo.

---

**Dica**: Execute `make help` para ver todos os comandos disponíveis!