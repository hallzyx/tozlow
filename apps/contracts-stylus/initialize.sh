#!/usr/bin/env bash
set -euo pipefail
# initialize.sh — Inicializa TozlowSession con la dirección USDC después del deploy
# Uso: CONTRACT_ADDRESS=0x... USDC_ADDRESS=0x... ./initialize.sh

DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ENVFILE="$DIR/.env.deploy"

if [ -f "$ENVFILE" ]; then
  export $(grep -v '^\s*#' "$ENVFILE" | xargs)
fi

if [ -z "${PRIVATE_KEY-}" ] || [ -z "${ARBITRUM_SEPOLIA_RPC_URL-}" ]; then
  echo "ERROR: falta PRIVATE_KEY o ARBITRUM_SEPOLIA_RPC_URL. Rellena $ENVFILE o exporta las vars."
  exit 1
fi

CONTRACT_ADDRESS="${CONTRACT_ADDRESS:-}"
USDC_ADDRESS="${USDC_ADDRESS:-0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d}"

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "ERROR: debes exportar CONTRACT_ADDRESS=0x... con la dirección del contrato desplegado."
  exit 1
fi

echo "Inicializando contrato $CONTRACT_ADDRESS con USDC $USDC_ADDRESS..."

cast send "$CONTRACT_ADDRESS" \
  "initialize(address)" "$USDC_ADDRESS" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$ARBITRUM_SEPOLIA_RPC_URL"

echo ""
echo "✅ Contrato inicializado. Verificando..."
STORED=$(cast call "$CONTRACT_ADDRESS" "usdcAddress()(address)" --rpc-url "$ARBITRUM_SEPOLIA_RPC_URL")
echo "   usdcAddress() = $STORED"

unset PRIVATE_KEY
