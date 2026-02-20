# Tozlow 🎉

> *¿Dijiste que ibas? Entonces vas. Y si no... pierdes la apuesta.*

Tozlow es una **dApp en Arbitrum Stylus** que penaliza con USDC a quienes faltan a una reunión de amigos acordada en cadena.

## Stack

| Capa | Herramienta |
|------|------------|
| Smart contracts | Rust + Stylus SDK v0.10 |
| Red | Arbitrum Sepolia (testnet) |
| Frontend | Next.js 15 + React 19 |
| Chain interaction | viem + wagmi |
| Estilos | Tailwind CSS v4 |
| Package manager | pnpm |

## Estructura del proyecto

```
tozlow/
├── apps/
│   ├── contracts-stylus/   # Contratos Rust (Stylus)
│   └── frontend/           # Next.js app
├── pnpm-workspace.yaml
└── package.json
```

## Flujo de usuario

1. **Crear sesión** — el host define: nombre, monto USDC por participante, fecha/hora de vencimiento y participantes (3-5).
2. **Unirse y depositar** — cada participante aprueba y deposita el monto en el contrato.
3. **Votar ausencia** — pasada la fecha, los participantes votan quiénes faltaron.
4. **Distribuir** — si hay mayoría sobre un ausente, su parte se reparte entre los asistentes.

## Quick Start

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno
cp apps/frontend/.env.example apps/frontend/.env.local

# 3. Desplegar contrato en testnet
pnpm contract:deploy:testnet

# 4. Copiar address del contrato en .env.local
# NEXT_PUBLIC_TOZLOW_ADDRESS=0x...

# 5. Levantar frontend
pnpm dev
```

## Redes

| Red | Chain ID | RPC |
|-----|----------|-----|
| Arbitrum Sepolia | 421614 | https://sepolia-rollup.arbitrum.io/rpc |

## Recursos

- [Arbitrum Stylus Docs](https://docs.arbitrum.io/stylus/quickstart)
- [Arbitrum Sepolia Explorer](https://sepolia.arbiscan.io)
- [USDC en Arbitrum Sepolia](https://developers.circle.com/stablecoins/docs/usdc-on-testnet)
# tozlow
