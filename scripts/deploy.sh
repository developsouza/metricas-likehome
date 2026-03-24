#!/usr/bin/env bash
# =============================================================
#  deploy.sh — Executado no servidor a cada push em main
#  Uso: APP_DIR=/opt/metricas-likehome bash deploy.sh
# =============================================================
set -euo pipefail

# Caminho absoluto do pm2 (Node via nvm no servidor)
PM2=/root/.nvm/versions/node/v24.14.0/bin/pm2
NODE=/root/.nvm/versions/node/v24.14.0/bin/node
export PATH="/root/.nvm/versions/node/v24.14.0/bin:$PATH"

APP_DIR="${APP_DIR:-/opt/metricas-likehome}"
LOG_DIR="/var/log/metricas-likehome"

echo "──────────────────────────────────────"
echo " Métricas LikeHome — Deploy $(date '+%Y-%m-%d %H:%M:%S')"
echo "──────────────────────────────────────"

# 1. Atualiza o código
echo "[1/5] Atualizando código..."
cd "$APP_DIR"
git pull origin main

# 2. Dependências do backend (apenas produção)
echo "[2/5] Instalando dependências do backend..."
cd "$APP_DIR/backend"
npm install --omit=dev

# 3. Build do frontend
echo "[3/5] Construindo frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build

# 4. Garante que o diretório de dados existe
echo "[4/5] Verificando estrutura de dados..."
mkdir -p "$APP_DIR/backend/data"
mkdir -p "$LOG_DIR"

# Cria o banco se não existir (primeiro deploy)
if [ ! -f "$APP_DIR/backend/data/database.sqlite" ]; then
  echo "    → Banco não encontrado, executando seed..."
  cd "$APP_DIR/backend"
  NODE_ENV=production "$NODE" --disable-warning=ExperimentalWarning src/seed.js
fi

# 5. Reinicia / inicia a API com PM2
echo "[5/5] Reiniciando API..."
cd "$APP_DIR/backend"
if "$PM2" describe metricas-likehome-api > /dev/null 2>&1; then
  "$PM2" reload ecosystem.config.js --env production
else
  "$PM2" start ecosystem.config.js --env production
fi
"$PM2" save

echo ""
echo "✅ Deploy concluído com sucesso!"
