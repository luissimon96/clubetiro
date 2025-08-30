# Guia de Uso da Planilha de Validação

## 📊 **COMO USAR A PLANILHA**

### **Arquivo:** `PLANILHA_VALIDACAO_CONTROLE.csv`

### **Campos Explicados:**

#### **Dados Básicos:**
- **ID:** Número sequencial para controle
- **Nome_Clube:** Nome completo do clube
- **Cidade_Estado:** Localização 
- **Contato_Principal:** Nome da pessoa de contato
- **Telefone/Email/Site:** Informações de contato

#### **Controle de Contatos:**
- **Data_Contato:** Quando fez o primeiro contato
- **Status_Contato:** Pendente/Contatado/Respondeu/Recusou
- **Data_Conversa:** Quando aconteceu a conversa
- **Duracao_Min:** Duração em minutos

#### **Informações Coletadas:**
- **Sistema_Atual:** Que sistema usam hoje
- **Custo_Atual_RS:** Quanto pagam mensalmente
- **Num_Associados:** Quantidade de membros
- **Principal_Dor:** Maior problema relatado

#### **Validação:**
- **Interesse_1a10:** Nível de interesse (1-10)
- **Funcionalidade_Prioridade:** Funcionalidade mais importante
- **Preco_Aceitavel_RS:** Preço que pagariam
- **Timing_Implementacao:** Quando implementariam
- **Quem_Decide:** Quem autoriza a compra

#### **Follow-up:**
- **Interesse_Piloto:** SIM/NÃO/TALVEZ
- **Proximos_Passos:** O que fazer depois
- **Observacoes:** Anotações gerais

### **Como Preencher:**

1. **Abra no Excel/Google Sheets**
2. **Atualize após cada contato**
3. **Use cores** para status (verde=interessado, vermelho=recusou)
4. **Ordene por interesse** para priorizar follow-ups

### **Exemplo Preenchido:**
```
ID: 1
Nome_Clube: SK Clube de Tiro
Status_Contato: Contatado
Data_Conversa: 02/09/2025
Sistema_Atual: eCACS
Custo_Atual_RS: 380
Interesse_1a10: 8
Interesse_Piloto: SIM
```