# Sistema SaaS para Clubes de Tiro - Requisitos e Análise de Mercado

**Data:** 30/08/2025  
**Status:** Brainstorming - Requisitos Validados  
**Próximo:** Definir MVP e validação com clubes piloto  

---

## 📊 ANÁLISE DE MERCADO

### Oportunidade Identificada
- **12.000+ atiradores** registrados no Brasil
- **350 clubes** filiados às confederações
- **27 federações** estaduais (CBTP)
- Mercado carente de soluções modernas e integradas

### Problemas dos Clubes Hoje
1. **Sistemas complexos e burocráticos** - Dificuldade de uso
2. **Documentação lenta** - CR's e processos demoram anos
3. **Comunicação deficiente** - WhatsApp e atendimento ruim
4. **Regulamentações complexas** - Exército, SFPC, múltiplas conformidades
5. **Alto custo** - Sistemas atuais são caros e pouco flexíveis
6. **Falta de integração** - Não há e-commerce integrado
7. **Gestão de eventos precária** - Controle manual de pontuações

### Concorrentes Principais
| Sistema | Clientes | Características | Desvantagens |
|---------|----------|-----------------|--------------|
| **eCACS** | 270+ clubes | Pioneer, completo | Caro, complexo |
| **Tiro Digital** | N/D | Nexal Tecnologia | Focado em documentos |
| **Shooting House** | N/D | Habitualidades | Limitado |
| **Clubes Associados** | N/D | App móvel | Genérico |

---

## 💰 MODELO DE NEGÓCIO

### Estrutura de Receita
```
🎯 MODELO HÍBRIDO COMPETITIVO:
├─ Taxa Base: R$ 97/mês (até 50 associados)
├─ Usuário Extra: R$ 3,50/associado adicional  
├─ E-commerce: +R$ 47/mês (módulo opcional)
└─ Setup: R$ 197 (única vez, treinamento incluso)
```

### Justificativa do Modelo
- **50% mais barato** que concorrentes (eCACS ~R$300-500/mês)
- **Escalável** - receita cresce com o clube
- **E-commerce diferencial** - receita adicional clara
- **Setup único** - cobre onboarding e treinamento

### Projeção MVP (10 clubes)
```
Receita Mensal:
├─ Base: R$ 97 × 10 = R$ 970/mês
├─ E-commerce: R$ 47 × 5 = R$ 235/mês
├─ Setup inicial: R$ 197 × 10 = R$ 1.970
└─ TOTAL ANO 1: R$ 1.205/mês + setup = R$ 16.430
```

---

## 🎯 SISTEMAS DE PONTUAÇÃO

### Modalidades a Implementar

#### 1. Tiro Esportivo (CBTE)
- **Pontuação:** 0-10 pontos por tiro (precisão)
- **Classes:** Automáticas por faixa de pontuação
- **Classificação:** Anual com promoção/rebaixamento
- **Modalidades:** Carabina, Pistola, Skeet, Trap

#### 2. Tiro Prático (IPSC)
- **Hit Factor:** Pontos ÷ Tempo
- **Zonas de pontuação:**
  - Alfa: 5 pontos
  - Charlie: 3 pontos  
  - Delta: 1 ponto
- **Penalidades:** Por erro ou tempo excedido
- **Divisões:** Open, Limited, Production, Revolver, etc.

### Funcionalidades Técnicas Necessárias
- ✅ Cadastro de eventos por modalidade
- ✅ Cronometragem automática (IPSC)
- ✅ Cálculo de pontuação em tempo real
- ✅ Rankings e classificações automáticas
- ✅ Histórico de performance por atleta
- ✅ Relatórios por modalidade e categoria

---

## 📋 CONTROLE FISCAL

### Obrigações Tributárias SaaS
| Tributo | Alíquota | Incidência | Observações |
|---------|----------|------------|-------------|
| **ISS** | 2-5% | Municipal | Sobre mensalidades |
| **PIS** | 0,65% ou 1,65% | Federal | Regime tributário |
| **COFINS** | 3% ou 7,6% | Federal | Regime tributário |
| **NFSe** | Obrigatória | Municipal | Emissão automática |

### Integrações Fiscais Necessárias
- **eNotas/Spedy/Notazz** - Emissão automática NFSe
- **Stripe + NFSe** - Integração pagamento → nota fiscal
- **API Receita Federal** - Validação CNPJ/CPF
- **Sistema municipal** - ISS por cidade do clube

### Fluxo Fiscal Automatizado
```
💳 Pagamento Stripe → 📄 NFSe automática → 📊 Relatório fiscal → 💰 Retenção impostos
```

---

## 🔧 ESPECIFICAÇÕES TÉCNICAS

### Funcionalidades Core - MVP
1. **Gestão de Clubes**
   - Cadastro e configuração de clubes
   - Controle de usuários funcionários
   - Dashboard administrativo

2. **Gestão de Associados**
   - Cadastro de membros e não-membros
   - Controle de mensalidades
   - Histórico de pagamentos
   - Comunicação (email/WhatsApp)

3. **Gestão de Eventos**
   - Criação de competições e treinamentos
   - Inscrições online
   - Controle de participantes
   - Sistemas de pontuação CBTE/IPSC

4. **Sistema de Pagamentos**
   - Stripe Brasil integrado
   - Cobrança automática de mensalidades
   - Pagamento de eventos/inscrições
   - Split payment (clube recebe, empresa cobra taxa)

5. **Controle Fiscal**
   - Emissão automática de NFSe
   - Relatórios fiscais
   - Integração com contabilidade

### Funcionalidades Avançadas - v2
1. **E-commerce Opcional**
   - Loja online personalizada
   - Domínio do clube
   - Produtos/equipamentos
   - Integração com estoque

2. **Relatórios Avançados**
   - Analytics de performance
   - Relatórios financeiros
   - Rankings nacionais
   - Exportação de dados

3. **App Mobile**
   - Aplicativo para associados
   - Check-in eventos
   - Consulta de pontuações
   - Notificações push

### Stack Técnica Sugerida
```
Frontend: Next.js + TailwindCSS + TypeScript
Backend: Node.js + Express + PostgreSQL
Pagamentos: Stripe Brasil + eNotas (NFSe)
Hospedagem: Vercel (frontend) + Railway (backend)
Email: Resend
Monitoramento: Sentry
Analytics: Posthog
```

---

## 📈 ROADMAP DE DESENVOLVIMENTO

### Fase 1: MVP (3-4 meses)
- [ ] Gestão básica de clubes e associados
- [ ] Sistema de pagamentos Stripe
- [ ] Eventos básicos com pontuação CBTE
- [ ] Controle fiscal (NFSe)
- [ ] Dashboard administrativo

### Fase 2: Beta (2 meses)
- [ ] Testes com 3-5 clubes piloto
- [ ] Refinamentos baseados em feedback
- [ ] Pontuação IPSC
- [ ] Relatórios básicos

### Fase 3: Launch (1 mês)
- [ ] 10 clubes pagantes
- [ ] Suporte ao cliente estruturado
- [ ] Documentação completa
- [ ] Onboarding automatizado

### Fase 4: Scale (6+ meses)
- [ ] E-commerce opcional
- [ ] App mobile
- [ ] Integrações avançadas
- [ ] 50+ clubes

---

## 🎯 PRÓXIMOS PASSOS

### Validação de Mercado
1. **Contactar 5-10 clubes** para validar interesse
2. **Definir clubes piloto** para testes beta
3. **Validar precificação** com potenciais clientes
4. **Mapear necessidades específicas** por região

### Desenvolvimento
1. **Definir arquitetura detalhada** do sistema
2. **Criar protótipos** das telas principais
3. **Configurar ambiente** de desenvolvimento
4. **Implementar MVP** com funcionalidades core

### Negócio
1. **Registrar empresa** e domínio
2. **Configurar Stripe** para recebimentos
3. **Definir termos de uso** e políticas
4. **Criar material de vendas** e onboarding

---

## 📞 CONTATOS E RECURSOS

### Organizações do Tiro Esportivo
- **CBTE** - Confederação Brasileira de Tiro Esportivo
- **CBTP** - Confederação Brasileira de Tiro Prático  
- **ACTB** - Associação dos Clubes de Tiro do Brasil

### Fornecedores Técnicos
- **Stripe Brasil** - Pagamentos
- **eNotas** - Emissão NFSe automática
- **Receita Federal** - APIs fiscais

### Ferramentas de Desenvolvimento
- GitHub/GitLab - Controle de versão
- Figma - Design de interfaces
- Notion/Linear - Gestão de projetos