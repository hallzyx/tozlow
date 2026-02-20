#!/usr/bin/env bash
set -euo pipefail
# deploy.sh — wrapper simple para desplegar TozlowSession
# Uso: coloca tu clave en apps/contracts-stylus/.env.deploy (no comitear)
# y ejecuta desde la raíz del repo: ./apps/contracts-stylus/deploy.sh

DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ENVFILE="$DIR/.env.deploy"

if [ -f "$ENVFILE" ]; then
  # exporta las variables (filtra comentarios y líneas vacías)
  export $(grep -v '^\s*#' "$ENVFILE" | xargs)
fi

if [ -z "${PRIVATE_KEY-}" ] || [ -z "${ARBITRUM_SEPOLIA_RPC_URL-}" ]; then
  echo "ERROR: falta PRIVATE_KEY o ARBITRUM_SEPOLIA_RPC_URL. Rellena $ENVFILE o exporta las vars."
  exit 1
fi

# Ejecuta cargo stylus directamente desde el directorio del contrato
pushd "$DIR" > /dev/null
cargo stylus deploy --endpoint "$ARBITRUM_SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY"
popd > /dev/null

unset PRIVATE_KEY
echo "Despliegue terminado (revisa la salida de arriba para la dirección del contrato)."
