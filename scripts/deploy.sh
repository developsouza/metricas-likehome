#!/usr/bin/env bash
# =============================================================
#  deploy.sh — Executado no servidor a cada push em main
#  Uso: APP_DIR=/opt/metricas-likehome bash deploy.sh
# =============================================================
set -euo pipefail

# Node instalado via nvm — adiciona o bin ao PATH para sessões SSH não-interativas
export NVM_DIR="${NVM_DIR:-/root/.nvm}"
# Carrega o nvm se disponível
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
# Fallback: garante que o bin do node/pm2 esteja no PATH diretamente
export PATH="$NVM_DIR/versions/node/$(ls "$NVM_DIR/versions/node" | sort -V | tail -1)/bin:$PATH"

PM2=$(command -v pm2)
echo "→ pm2: $PM2"

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
  NODE_ENV=production node --disable-warning=ExperimentalWarning src/seed.js
fi

# 5. Reinicia / inicia a API com PM2
echo "[5/5] Reiniciando API..."
cd "$APP_DIR/backend"
if pm2 describe metricas-likehome-api > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi
pm2 save

echo ""
echo "✅ Deploy concluído com sucesso!"
