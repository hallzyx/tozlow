Despliegue del contrato Stylus (TozlowSession)

1) Añade un archivo de entorno local en este folder (no lo comites):
   - Copia `.env.deploy.example` -> `.env.deploy`

2) Rellena los valores:
   PRIVATE_KEY=0x...
   ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/TU_KEY

3) Desde la raíz del repo despliega:

```bash
pnpm --filter contracts-stylus run deploy:testnet
```

4) Copia la dirección del contrato desplegado a `apps/frontend/.env.local`:
   NEXT_PUBLIC_TOZLOW_ADDRESS=0x<nueva_dirección>

5) **⚠️ Inicializa el contrato (OBLIGATORIO):**
   Sin este paso el contrato tiene `usdcAddress = 0x000...000` y todos
   los depósitos revertirán con una estimación de gas absurda en MetaMask.

```bash
CONTRACT_ADDRESS=0x<nueva_dirección> ./apps/contracts-stylus/initialize.sh
```

   El script lee `PRIVATE_KEY` y `ARBITRUM_SEPOLIA_RPC_URL` de `.env.deploy`
   y verifica que `usdcAddress()` devuelva la dirección correcta al finalizar.

Notas de seguridad:
- Usa una cuenta de prueba, no tu cuenta principal.
- El archivo `.env.deploy` nunca debe ser commiteado (está en `.gitignore`).
- El script limpia `PRIVATE_KEY` del entorno al terminar con `unset PRIVATE_KEY`.
