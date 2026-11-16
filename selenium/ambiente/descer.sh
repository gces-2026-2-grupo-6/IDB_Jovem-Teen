#!/usr/bin/env bash
# Derruba o ambiente. O banco é temporário: os dados de teste somem junto.
set -euo pipefail
cd "$(dirname "$0")"
docker compose down
