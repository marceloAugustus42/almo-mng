# 📦 Almoxarifado — Sistema Web Local

Sistema de controle de estoque para uso local no navegador.  
Desenvolvido em **React + Vite + TailwindCSS**.

---

## ✅ Pré-requisitos

- [Node.js 18+](https://nodejs.org/) instalado no computador
- Navegador moderno (Chrome, Edge, Firefox)

---

## 🚀 Como instalar e rodar

### 1. Instalar dependências (apenas na primeira vez)

Abra o **Prompt de Comando** (cmd) dentro da pasta `almoxa-web` e execute:

```bash
npm install
```

### 2. Iniciar o sistema

```bash
npm run dev
```

### 3. Abrir no navegador

Acesse: **http://localhost:5173**

---

## 📁 Onde ficam os dados

Os dados são salvos automaticamente no **LocalStorage** do navegador.  
Não é necessário instalar banco de dados.

> ⚠️ **Importante:** Não limpe os dados do navegador para não perder os registros.  
> Quando o backend Express estiver configurado, os dados migrarão para SQLite (arquivo `.db` portátil).

---

## 📄 Funcionalidades

| Página | O que faz |
|---|---|
| **Dashboard** | KPIs, alertas de estoque crítico, gráficos por destino e item, últimas movimentações |
| **Estoque** | Cadastro de itens, saldo em tempo real, status por cor, filtros e ordenação |
| **Entradas** | Registro de recebimento com NF e fornecedor, histórico filtrável |
| **Saídas** | Envio para os 9 destinos, saldo disponível em tempo real, histórico |
| **Por Destino** | Saídas e somatório por item para cada destino, exportação Excel |
| **Relatórios** | Exportação completa em .xlsx, gráfico mensal comparativo |

---

## 📤 Exportação Excel

As exportações geram arquivos `.xlsx` no mesmo formato visual das planilhas originais:
- `Almoxarifado_Completo.xlsx` — todas as abas
- `Almoxarifado_Saidas_Destino.xlsx` — uma aba por destino com somatório
- `Almoxarifado_Entradas.xlsx` — relatório de entradas

---

## 🔌 Conectar ao backend (opcional, para múltiplos computadores)

Se quiser rodar com banco de dados SQLite real:

```bash
# Na pasta backend/
npm install express better-sqlite3 cors
node server.js   # porta 3001
```

O frontend detecta automaticamente o backend e usa a API em vez do LocalStorage.

---

## 🆘 Problemas comuns

**"npm não é reconhecido"** → Instale o Node.js em https://nodejs.org  
**Página em branco** → Verifique se o terminal mostra "ready" e acesse http://localhost:5173  
**Dados sumidos** → Verifique se não limpou o cache/histórico do navegador
