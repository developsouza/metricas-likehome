# 📊 Métricas LikeHome

Sistema de gestão e acompanhamento de indicadores estratégicos (KRIs/KPIs) para administração de imóveis/short stay, com dashboard BI consolidado.

---

## 🛠️ Stack Tecnológica

| Camada     | Tecnologia              |
|------------|-------------------------|
| Back-end   | Node.js + Express       |
| Front-end  | React (Vite)            |
| Banco      | SQLite (better-sqlite3) |
| Auth       | JWT                     |
| Gráficos   | Recharts                |

---

## 📁 Estrutura do Projeto

```
metricas-likehome/
├── backend/
│   ├── src/
│   │   ├── controllers/      ← authController, dashboardController, etc.
│   │   ├── middlewares/      ← auth.js (JWT)
│   │   ├── routes/           ← index.js (todas as rotas)
│   │   ├── database.js       ← inicialização SQLite
│   │   ├── seed.js           ← dados de demonstração
│   │   └── server.js         ← entrada Express
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/       ← Layout.jsx, Sidebar.jsx
    │   ├── contexts/         ← AuthContext.jsx
    │   ├── pages/
    │   │   ├── auth/         ← Login.jsx
    │   │   ├── dashboard/    ← DashboardAdmin, DashboardDepto, BI
    │   │   ├── pipeline/     ← Pipeline.jsx
    │   │   ├── lancamentos/  ← Lancamentos.jsx
    │   │   └── admin/        ← Empreendimentos, Indicadores, Usuarios
    │   ├── services/         ← api.js (axios)
    │   └── utils/            ← format.js
    └── package.json
```

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- Node.js 18+
- npm

### 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# ⚠️ Se better-sqlite3 falhar no build (headers ausentes):
cd node_modules/better-sqlite3
node-gyp rebuild --nodedir=/usr
cd ../..

# Criar banco e seed de demonstração
node src/seed.js

# Iniciar servidor (porta 3001)
node src/server.js
# ou: npm run dev (com nodemon)
```

### 2. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Modo desenvolvimento (porta 5173, com proxy para API)
npm run dev

# Build de produção
npm run build
```

### 3. Acessar o sistema

- Frontend Dev: http://localhost:5173
- API: http://localhost:3001
- Health check: http://localhost:3001/health

---

## 👤 Usuários de Demonstração

| E-mail                     | Senha     | Perfil        | Departamento   |
|----------------------------|-----------|---------------|----------------|
| admin@likehome.com         | admin123  | Administrador | Geral          |
| ana@likehome.com           | user123   | Usuário       | Marketing      |
| carlos@likehome.com        | user123   | Usuário       | Comercial      |
| beatriz@likehome.com       | user123   | Usuário       | Atendimento    |
| pedro@likehome.com         | user123   | Usuário       | Precificação   |
| fernanda@likehome.com      | user123   | Usuário       | Financeiro     |

---

## 🗂️ Módulos do Sistema

### Admin
- **Dashboard Admin** — KRIs consolidados, gráficos de EBITDA, ocupação, leads, pipeline em pizza
- **Análise BI** — Gráficos de série temporal, radar de performance, comparativo entre departamentos
- **Pipeline de Unidades** — Tabela filtrável com todos os status (Prospecção → Ativo → Baixa), histórico de datas
- **Empreendimentos** — CRUD completo com contagem de unidades
- **Unidades** — CRUD com pipeline e histórico de mudança de status
- **Lançamento de Indicadores** — Lançamento por departamento e competência com barra de progresso
- **Indicadores** — CRUD dos KRIs/KPIs cadastrados
- **Usuários** — CRUD com vínculo de departamento

### Usuário (departamento)
- **Dashboard do Departamento** — KRIs em cards com progress bar, gráfico de evolução clicável, tabela de KPIs com sparklines
- **Lançar Indicadores** — Formulário simples dos indicadores do próprio departamento
- **Pipeline** — Leitura dos status de unidades (read-only)

---

## 📊 Indicadores Pré-cadastrados

### Marketing (5)
- Leads qualificados de proprietários por mês (KRI)
- Leads de hóspedes por mês (KRI)
- Custo por lead — CPL (KPI)
- Reuniões geradas para o comercial (KPI)
- Taxa de qualificação dos leads (KPI)

### Comercial (4)
- Crescimento líquido de unidades (KRI)
- Número de reuniões realizadas (KPI)
- Taxa de conversão reunião → contrato (KPI)
- Tempo médio de fechamento (KPI)

### Atendimento (4)
- Nota média nas OTAs (KRI)
- Tempo médio de resposta ao hóspede (KPI)
- Taxa de resolução no primeiro contato (KPI)
- Reclamações por reserva (KPI)

### Precificação (4)
- Receita média por unidade (KRI)
- Taxa de ocupação (KPI)
- Diária média — ADR (KPI)
- Ranking dos anúncios nas OTAs (KPI)

### Financeiro (4)
- Resultado operacional — EBITDA (KRI)
- Resultado mensal consolidado — DRE (KRI)
- Receita média por unidade (KPI)
- Previsibilidade de fluxo de caixa (KPI)

---

## 🔌 API REST — Principais Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
GET    /api/dashboard/admin?competencia=YYYY-MM
GET    /api/dashboard/departamento/:depto?competencia=YYYY-MM
GET    /api/dashboard/bi?competencia_inicio=YYYY-MM&competencia_fim=YYYY-MM
GET    /api/empreendimentos
POST   /api/empreendimentos
PUT    /api/empreendimentos/:id
GET    /api/unidades?status=&empreendimento_id=
GET    /api/unidades/pipeline/resumo
POST   /api/unidades
PUT    /api/unidades/:id
GET    /api/indicadores?departamento=&tipo=
GET    /api/lancamentos?competencia=&departamento=
POST   /api/lancamentos
PUT    /api/lancamentos/:id
GET    /api/usuarios
POST   /api/usuarios
PUT    /api/usuarios/:id
```

---

## 🚀 Deploy em VPS (Linux + NGINX + PM2)

```bash
# Backend com PM2
pm2 start backend/src/server.js --name "metricas-api"
pm2 save && pm2 startup

# Frontend: build e servir estático
cd frontend && npm run build
# Servir dist/ via NGINX

# NGINX config básica
server {
  listen 80;
  server_name seu-dominio.com;

  # Frontend
  root /var/www/metricas-likehome/frontend/dist;
  index index.html;
  try_files $uri /index.html;

  # Proxy para API
  location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## 📝 Observações Técnicas

- O banco SQLite é criado automaticamente em `backend/database.sqlite` na primeira execução
- Para resetar os dados de demonstração: delete `database.sqlite` e rode `node src/seed.js` novamente
- O JWT expira em 8h (configurável em `.env`)
- better-sqlite3 usa binários nativos — pode precisar rebuild em ambientes sem headers Node.js (ver instruções acima)
