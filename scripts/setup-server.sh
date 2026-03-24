#!/usr/bin/env bash
# =============================================================
#  setup-server.sh — Configuração inicial do servidor Linux
#  Testado em Ubuntu 22.04 / Debian 12
#  Execute como root: sudo bash setup-server.sh
# =============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/metricas-likehome}"
REPO_URL="${REPO_URL:-}"   # Ex: git@github.com:sua-org/metricas-likehome.git
DEPLOY_USER="${DEPLOY_USER:-deploy}"

if [ -z "$REPO_URL" ]; then
  echo "❌ Defina a variável REPO_URL antes de executar."
  echo "   Ex: REPO_URL=git@github.com:org/repo.git sudo bash setup-server.sh"
  exit 1
fi

echo "══════════════════════════════════════════"
echo " Setup do Servidor — Métricas LikeHome"
echo "══════════════════════════════════════════"

# ── Dependências do sistema ───────────────────
echo "[1/8] Instalando dependências do sistema..."
apt-get update -qq
apt-get install -y curl git nginx ufw

# ── Node.js 22 (via NodeSource) ───────────────
echo "[2/8] Instalando Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# ── PM2 ──────────────────────────────────────
echo "[3/8] Instalando PM2..."
npm install -g pm2

# ── Usuário de deploy ────────────────────────
echo "[4/8] Criando usuário '$DEPLOY_USER'..."
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
fi

# ── Diretórios ───────────────────────────────
echo "[5/8] Criando estrutura de diretórios..."
mkdir -p "$APP_DIR/backend/data"
mkdir -p /var/log/metricas-likehome
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" /var/log/metricas-likehome

# ── Clonar repositório ───────────────────────
echo "[6/8] Clonando repositório..."
if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u "$DEPLOY_USER" git clone "$REPO_URL" "$APP_DIR"
fi

# ── Arquivo .env ─────────────────────────────
echo "[7/8] Configurando variáveis de ambiente..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
  cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
  echo ""
  echo "⚠️  IMPORTANTE: Edite o arquivo $APP_DIR/backend/.env"
  echo "   antes de continuar!"
  echo "   Pressione ENTER após editar o arquivo..."
  read -r
fi

# ── PM2 startup ──────────────────────────────
echo "[8/8] Configurando PM2 para iniciar no boot..."
pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER" | tail -1 | bash || true

echo ""
echo "══════════════════════════════════════════"
echo " Próximos passos:"
echo "  1. Configure o Nginx:"
echo "     cp $APP_DIR/nginx/metricas-likehome.conf /etc/nginx/sites-available/metricas-likehome"
echo "     ln -s /etc/nginx/sites-available/metricas-likehome /etc/nginx/sites-enabled/"
echo "     nginx -t && systemctl reload nginx"
echo ""
echo "  2. Execute o primeiro deploy:"
echo "     cd $APP_DIR && bash scripts/deploy.sh"
echo ""
echo "  3. Configure os Secrets no GitHub (veja DEPLOY.md)"
echo "══════════════════════════════════════════"
