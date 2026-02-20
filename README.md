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
# 1. Install dependencies
pnpm install

# 2. Setup environment variables
cp apps/frontend/.env.example apps/frontend/.env.local

# 3. Deploy contract to testnet
pnpm contract:deploy:testnet

# 4. Set contract address in .env.local
# NEXT_PUBLIC_TOZLOW_ADDRESS=0x...

# 5. Start frontend
pnpm dev
```

## Networks

| Network | Chain ID | RPC |
|-----|----------|-----|
| Arbitrum Sepolia | 421614 | https://sepolia-rollup.arbitrum.io/rpc |

## Resources

- [Arbitrum Stylus Docs](https://docs.arbitrum.io/stylus/quickstart)
- [Arbitrum Sepolia Explorer](https://sepolia.arbiscan.io)
- [USDC on Arbitrum Sepolia](https://developers.circle.com/stablecoins/docs/usdc-on-testnet)
