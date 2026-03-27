# Comandos de Reseed Manual — Servidor de Produção

## Opção 1 — Deploy completo com reseed (recomendado)

Executa git pull + reseed + reinicia PM2 em um único comando:

```bash
FORCE_RESEED=true APP_DIR=/opt/metricas-likehome bash /opt/metricas-likehome/scripts/deploy.sh
```

---

## Opção 2 — Apenas reseed (sem git pull)

Somente recria o banco com os dados reais, sem atualizar o código:

```bash
export APP_DIR="/opt/metricas-likehome"
export NODE=/root/.nvm/versions/node/v24.14.0/bin/node
export PATH="/root/.nvm/versions/node/v24.14.0/bin:$PATH"

rm -f $APP_DIR/backend/data/database.sqlite
rm -f $APP_DIR/backend/data/database.sqlite-shm
rm -f $APP_DIR/backend/data/database.sqlite-wal

cd $APP_DIR/backend
NODE_ENV=production DB_PATH="$APP_DIR/backend/data/database.sqlite" \
  $NODE --disable-warning=ExperimentalWarning src/seed.js
```

---

## Observação

A partir de agora o deploy automático (GitHub Actions) já detecta mudanças
no `seed.js` ou no CSV e recria o banco sem precisar de `FORCE_RESEED`.
Este arquivo só é necessário para execução manual pontual.
