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

## Documentation

- [Architecture](ARCHITECTURE.md) - Technical overview of the smart contracts and frontend.
- [Session Creation Flow](SESSION_CREATION_FLOW.md) - Detailed breakdown of the session lifecycle.
- [Product Report](TOZLOW_PRODUCT_REPORT.md) - Executive summary and product value proposition.
- [Deployment Guide](apps/contracts-stylus/README_DEPLOY.md) - Instructions for deploying the Stylus contract.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp apps/frontend/.env.example apps/frontend/.env.local

# 3. Deploy contract to testnet
pnpm contract:deploy:testnet

# 4. Initialize the contract with the USDC address
#    (mandatory step after any deploy, otherwise deposits will fail)
export PRIVATE_KEY=0x...
export ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0x<contract_address> ./apps/contracts-stylus/initialize.sh

# 5. Update .env.local with the contract address
# NEXT_PUBLIC_TOZLOW_ADDRESS=0x...

# 6. Start the frontend
pnpm dev
```

> **⚠️ Important:** Step 4 (`initialize`) is **mandatory** after every deploy.
> Without it, `usdcAddress()` returns `0x000...000` and all deposit
> transactions will fail with an absurd gas estimation in MetaMask.

## Networks

| Network | Chain ID | RPC |
|-----|----------|-----|
| Arbitrum Sepolia | 421614 | https://sepolia-rollup.arbitrum.io/rpc |

## Gas on Arbitrum

The frontend fetches fresh fees from the current block before sending **any** transaction (`createSession`, `deposit`, `castVote`, `finalizeSession`). This prevents the **"max fee per gas less than block base fee"** error that occurs when the next block's base fee is higher than the one estimated at the time of the click.

The calculation uses:
```
maxFeePerGas = current_baseFeePerGas × 1.5
maxPriorityFeePerGas = 0.001 gwei
```

On Arbitrum Sepolia, the base gas is ~0.02 gwei, so the actual cost remains fractions of a cent.

## Resources

- [Arbitrum Stylus Docs](https://docs.arbitrum.io/stylus/quickstart)
- [Arbitrum Sepolia Explorer](https://sepolia.arbiscan.io)
- [USDC on Arbitrum Sepolia](https://developers.circle.com/stablecoins/docs/usdc-on-testnet)
