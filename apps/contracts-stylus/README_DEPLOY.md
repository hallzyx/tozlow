Despliegue del contrato Stylus (TozlowSession)

1) Añade un archivo de entorno local en este folder (no lo comites):
   - Copia `.env.deploy.example` -> `.env.deploy` o `.env.local`

2) Rellena los valores:
   PRIVATE_KEY=0x...
   ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

3) Desde la raíz del repo ejecuta:

```bash
# carga variables temporalmente y ejecuta el script de despliegue
export ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
PRIVATE_KEY="0xTU_CLAVE_PRIVADA" pnpm --filter contracts-stylus run deploy:testnet

# o, si guardaste en .env.deploy, carga antes:
# export $(cat apps/contracts-stylus/.env.deploy | xargs)
# pnpm --filter contracts-stylus run deploy:testnet
```

4) Tras desplegar, copia la dirección del contrato y pégala en `apps/frontend/.env.local` como `NEXT_PUBLIC_TOZLOW_ADDRESS`.

Notas de seguridad:
- Usa una cuenta de prueba, no tu cuenta principal.
- Borra la clave del entorno con `unset PRIVATE_KEY` cuando termines.
