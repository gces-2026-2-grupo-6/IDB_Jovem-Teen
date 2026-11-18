#!/usr/bin/env bash
# Sobe banco, Keycloak e back-end reais e prepara os usuários de teste.
set -euo pipefail
cd "$(dirname "$0")"
docker compose up -d --build
echo "Esperando o back-end..."
for _ in $(seq 1 60); do
  curl -sf http://localhost:8000/evento/ >/dev/null && break
  sleep 3
done
python3 -I preparar_keycloak.py
echo "Ambiente pronto. Agora suba o front (veja o README)."
