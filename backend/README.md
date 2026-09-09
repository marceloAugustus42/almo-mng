# Backend — Almoxarifado

API REST em Node.js + Express + MySQL.

## Pré-requisitos
- Node.js 18+
- MySQL 8+ rodando localmente

## Instalação

```bash
cd backend
npm install
```

## Configuração

Copie `.env.example` para `.env` e preencha:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha
DB_NAME=almoxarifado
PORT=3001
```

## Criar o banco e tabelas

```bash
mysql -u root -p < src/db/schema.sql
```

## Popular com dados de teste

```bash
npm run seed
```

## Iniciar o servidor

```bash
npm start          # produção
npm run dev        # desenvolvimento (hot reload com nodemon)
```

Acesse: **http://localhost:3001/api**

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | /api/itens | Lista itens com saldo |
| POST | /api/itens | Cadastra item |
| PUT | /api/itens/:id | Edita item |
| DELETE | /api/itens/:id | Remove item (soft delete) |
| GET | /api/entradas | Lista entradas (filtros: de, ate, item) |
| POST | /api/entradas | Registra entrada |
| DELETE | /api/entradas/:id | Remove entrada |
| GET | /api/saidas | Lista saídas (filtros: de, ate, destino, item) |
| POST | /api/saidas | Registra saída |
| DELETE | /api/saidas/:id | Remove saída |
| GET | /api/dashboard | KPIs + gráficos (filtros: mes, ano) |

## Estrutura

```
backend/
├── src/
│   ├── db/
│   │   ├── connection.js   # Pool MySQL
│   │   └── schema.sql      # Tabelas + view vw_saldos
│   ├── models/
│   │   ├── BaseModel.js    # Query helper compartilhado
│   │   ├── ItemModel.js
│   │   ├── EntradaModel.js
│   │   ├── SaidaModel.js
│   │   └── DashboardModel.js
│   ├── controllers/        # Lógica HTTP (req/res)
│   ├── routes/index.js     # Mapeamento de rotas
│   └── server.js           # Entry point
└── tests/seed.js           # Dados de teste
```
