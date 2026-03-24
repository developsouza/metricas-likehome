#!/bin/bash
echo "🚀 Iniciando Métricas LikeHome — Backend"
cd "$(dirname "$0")"
if [ ! -f database.sqlite ]; then
  echo "📦 Criando banco e inserindo dados de demonstração..."
  node src/seed.js
fi
node src/server.js
