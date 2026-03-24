# Deploy — Métricas LikeHome

Guia rápido para colocar a aplicação em produção com deploy automático via GitHub Actions.

---

## Arquitetura de Produção

```
Internet → Nginx (80/443) → /api/* → Node.js :3001 (PM2)
                          → /*     → frontend/dist/ (estático)
```

---

## 1. Pré-requisitos no Servidor

- Ubuntu 22.04+ ou Debian 12+
- Acesso root ou sudo
- Chave SSH configurada para o usuário de deploy

### Setup inicial (apenas uma vez)

```bash
# No servidor, como root:
REPO_URL=git@github.com:SUA-ORG/metricas-likehome.git \
DEPLOY_USER=deploy \
bash scripts/setup-server.sh
```

### Configurar o Nginx

```bash
cp /opt/metricas-likehome/nginx/metricas-likehome.conf \
   /etc/nginx/sites-available/metricas-likehome

# Edite o server_name para o seu domínio/IP:
nano /etc/nginx/sites-available/metricas-likehome

ln -s /etc/nginx/sites-available/metricas-likehome \
      /etc/nginx/sites-enabled/

nginx -t && systemctl reload nginx
```

### Configurar variáveis de ambiente

```bash
nano /opt/metricas-likehome/backend/.env
```

Preencha todos os campos do `.env.example`, especialmente:

- `JWT_SECRET` — gere com: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `ALLOWED_ORIGIN` — domínio ou IP do servidor
- `DB_PATH` — `/opt/metricas-likehome/backend/data/database.sqlite`

### Primeiro deploy manual

```bash
cd /opt/metricas-likehome
bash scripts/deploy.sh
```

---

## 2. GitHub Actions — Secrets Necessários

Acesse **Settings → Secrets and variables → Actions** no seu repositório e adicione:

| Secret            | Descrição                         | Exemplo                  |
| ----------------- | --------------------------------- | ------------------------ |
| `SSH_HOST`        | IP ou hostname do servidor        | `192.168.1.10`           |
| `SSH_USER`        | Usuário SSH                       | `deploy`                 |
| `SSH_PRIVATE_KEY` | Conteúdo da chave privada SSH     | `-----BEGIN OPENSSH...`  |
| `SSH_PORT`        | Porta SSH (opcional, padrão 22)   | `22`                     |
| `APP_DIR`         | Diretório da aplicação (opcional) | `/opt/metricas-likehome` |

### Gerar o par de chaves SSH para o deploy

```bash
# Na sua máquina local:
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/metricas_deploy

# Adicione a chave pública no servidor (como o usuário de deploy):
ssh-copy-id -i ~/.ssh/metricas_deploy.pub deploy@SEU_SERVIDOR

# Copie o conteúdo da chave PRIVADA para o Secret SSH_PRIVATE_KEY:
cat ~/.ssh/metricas_deploy
```

---

## 3. HTTPS com Let's Encrypt (recomendado)

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d metricaslike.g3tsistemas.com.br
```

---

## 4. Fluxo de Deploy

1. Faça push na branch `main`
2. O GitHub Actions conecta ao servidor via SSH
3. Executa `scripts/deploy.sh` que:
    - Faz `git pull`
    - Instala dependências do backend
    - Faz build do frontend
    - Reinicia a API com PM2

Você também pode acionar o deploy manualmente em **Actions → Deploy → Run workflow**.

---

## 5. Comandos úteis no servidor

```bash
# Ver status da API
pm2 status

# Ver logs em tempo real
pm2 logs metricas-likehome-api

# Reiniciar manualmente
pm2 restart metricas-likehome-api

# Health check
curl http://localhost:3001/health
```
