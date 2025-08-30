# Nuxt Minimal Starter

# Planejamento para Clube de Tiro (CRUD Nuxt + Tailwind)

## 1. Entidades Principais (Modelos)
- Usuário: id, nome, email, senha (hash), tipo (admin, comum), dataCadastro, últimoLogin
- Evento: id, nome, data, local, descrição, status, participantes[], resultados[], criadoPor
- Participante: id, nome, email, telefone, associado (bool), eventosInscritos[]
- Resultado: id, eventoId, participanteId, pontuação, ranking, observações
- Mensalidade: id, participanteId, tipoPlano (mensal, trimestral, semestral, anual), valor, dataInicio, dataFim, status
- Relatório: id, tipo, dataGeracao, dados, arquivoPDF
- Notificação: id, usuarioId, tipo, mensagem, dataEnvio, lida

## 2. Contextos
- Autenticação e Sessão: Cadastro, login, expiração por inatividade, redefinição de senha
- Gerenciamento de Eventos: CRUD de eventos, inscrição de participantes, controle de status
- Gerenciamento de Participantes: CRUD de participantes, associação a eventos, controle de mensalidades
- Sistema de Pontuação e Ranking: Registro de resultados, cálculo de ranking, exibição em dashboards
- Relatórios e Métricas: Geração de relatórios PDF, métricas de uso, exportação
- Notificações: Envio de emails para eventos e atualizações
- Dashboard Administrativo: Visualização de métricas, relatórios, gerenciamento geral
- SEO: Palavras-chave, meta descrição, sitemap, performance

## 3. Pontos de Integração
- Email (SMTP ou serviço externo)
- Geração de PDF (ex: jsPDF, pdfmake)
- Autenticação (ex: JWT, cookies)

## 4. Tarefas Iniciais
- [x] Scaffold Nuxt + Tailwind
- [ ] Definir modelos (acima)
- [ ] Criar estrutura de pastas (pages, components, composables, server/api)
- [ ] Implementar autenticação básica (cadastro/login/logout)
- [ ] CRUD de eventos e participantes
- [ ] Sistema de pontuação e ranking
- [ ] Relatórios em PDF
- [ ] Notificações por email
- [ ] Dashboard admin
- [ ] SEO básico (meta tags, sitemap)

## Observações
- Utilizar Nuxt server routes para API CRUD.
- Utilizar composables para lógica de autenticação e sessão.
- Tailwind para UI responsiva.
- Adicionar testes e documentação conforme avança.

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
