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

# ── Detecção automática de mudança no seed ─────────────────────────────────
# Calcula hash combinado de seed.js + CSV. Se mudaram desde o último deploy,
# o banco é recriado automaticamente com os dados mais recentes.
SEED_FILE="$APP_DIR/backend/src/seed.js"
CSV_FILE="$APP_DIR/Relatorio Comercial - LikeHome v3(BaseDados).csv"
SEED_HASH_FILE="$APP_DIR/backend/data/.seed_hash"

CURRENT_HASH=$(sha256sum "$SEED_FILE" "$CSV_FILE" 2>/dev/null | sha256sum | awk '{print $1}')
STORED_HASH=""
[ -f "$SEED_HASH_FILE" ] && STORED_HASH=$(cat "$SEED_HASH_FILE")

FORCE_RESEED="${FORCE_RESEED:-false}"

if [ ! -f "$APP_DIR/backend/data/database.sqlite" ]; then
  SEED_REASON="Banco não encontrado — executando seed inicial..."
  SHOULD_SEED=true
elif [ "$FORCE_RESEED" = "true" ]; then
  SEED_REASON="FORCE_RESEED ativado — recriando banco com dados atuais..."
  SHOULD_SEED=true
elif [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  SEED_REASON="seed.js ou CSV foram alterados — recriando banco automaticamente..."
  SHOULD_SEED=true
else
  SHOULD_SEED=false
fi

if [ "$SHOULD_SEED" = "true" ]; then
  echo "    → $SEED_REASON"
  rm -f "$APP_DIR/backend/data/database.sqlite"
  rm -f "$APP_DIR/backend/data/database.sqlite-shm"
  rm -f "$APP_DIR/backend/data/database.sqlite-wal"
  cd "$APP_DIR/backend"
  NODE_ENV=production DB_PATH="$APP_DIR/backend/data/database.sqlite" "$NODE" --disable-warning=ExperimentalWarning src/seed.js
  echo "$CURRENT_HASH" > "$SEED_HASH_FILE"
else
  echo "    → Banco atualizado, seed não necessário."
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
