# Tozlow

> *Did you say you were coming? Then show up.*

Tozlow is a **dApp on Arbitrum Stylus** that penalizes friends who flake on agreed-upon meetups with USDC.

## Stack

| Layer | Tool |
|------|------------|
| Smart contracts | Rust + Stylus SDK v0.10 |
| Network | Arbitrum Sepolia (testnet) |
| Frontend | Next.js 15 + React 19 |
| Chain interaction | viem + wagmi |
| Styling | Tailwind CSS v4 |
| Motion/UI | Framer Motion + GSAP + curated hero imagery |
| Package manager | pnpm |

## Project Structure

```
tozlow/
├── apps/
│   ├── contracts-stylus/   # Rust Contracts (Stylus)
│   └── frontend/           # Next.js app
├── pnpm-workspace.yaml
└── package.json
```

## User Flow

1. **Create Session** — The host defines: amount per person (USDC), deadline, and participants (3-5).
2. **Join & Deposit** — Each participant approves and deposits the amount into the smart contract.
3. **Vote Absentee** — After the event deadline, participants verify who didn't show up.
4. **Distribute** — If the majority votes someone as absent, their deposit is slashed and distributed among the attendees.

## Demo Routes

- `/` — Main dApp (sessions, deposit, vote, finalize).
- `/welcome` — Landing/dashboard experience for hackathon demos and first-time viewers.

## Visual Notes

- `/welcome` includes a technology-themed hero image with animated overlays.
- A subtle grid background is used to reinforce the product's technical identity without adding visual noise.

## Quick Start

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp apps/frontend/.env.example apps/frontend/.env.local

# 3. Desplegar contrato en testnet
pnpm contract:deploy:testnet

# 4. Inicializar el contrato con la dirección de USDC
#    (paso obligatorio después de cualquier deploy, o el depósito fallará)
export PRIVATE_KEY=0x...
export ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/TU_KEY
CONTRACT_ADDRESS=0x<contrato> ./apps/contracts-stylus/initialize.sh

# 5. Actualizar .env.local con la dirección del contrato
# NEXT_PUBLIC_TOZLOW_ADDRESS=0x...

# 6. Arrancar el frontend
pnpm dev
```

> **⚠️ Importante:** El paso 4 (`initialize`) es **obligatorio** tras cada deploy.
> Sin él, `usdcAddress()` devuelve `0x000...000` y todas las transacciones
> de depósito fallan con una estimación de gas absurda en MetaMask.

## Networks

| Network | Chain ID | RPC |
|-----|----------|-----|
| Arbitrum Sepolia | 421614 | https://sepolia-rollup.arbitrum.io/rpc |

## Gas en Arbitrum

El frontend obtiene fees frescos del bloque actual antes de enviar **cualquier** transacción (`createSession`, `deposit`, `castVote`, `finalizeSession`). Esto evita el error **"max fee per gas less than block base fee"** que ocurre cuando el base fee del siguiente bloque es mayor al estimado en el momento del click.

El cálculo usa:
```
maxFeePerGas = baseFeePerGas_actual × 1.5
maxPriorityFeePerGas = 0.001 gwei
```

En Arbitrum Sepolia el gas base es ~0.02 gwei, por lo que el costo real sigue siendo fracciones de centavo.

## Resources

- [Arbitrum Stylus Docs](https://docs.arbitrum.io/stylus/quickstart)
- [Arbitrum Sepolia Explorer](https://sepolia.arbiscan.io)
- [USDC on Arbitrum Sepolia](https://developers.circle.com/stablecoins/docs/usdc-on-testnet)
