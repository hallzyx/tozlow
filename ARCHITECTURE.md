# Tozlow Architecture

## Overview
Tozlow utilizes a monolithic repository structure managed by pnpm workspaces, integrating a Rust-based smart contract backend (Arbitrum Stylus) with a Next.js frontend.

## Components

### 1. Smart Contracts (`apps/contracts-stylus`)
- **Language**: Rust
- **Framework**: Arbitrum Stylus SDK
- **Logic**: 
  - Manages session state (created, active, finalized).
  - Handles USDC deposits via ERC-20 interaction.
  - Implements voting mechanism for slashing/refunding absent participants.

### 2. Frontend (`apps/frontend`)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 with custom glassmorphism theme variables.
- **Motion & Visual Layer**: Framer Motion + GSAP + curated technology imagery (`/welcome` route).
- **Web3 Integration**:
  - `wagmi` for React hooks (`useWriteContract`, `useReadContract`, `usePublicClient`, etc.).
  - `viem` for low-level interaction.
  - `lucide-react` for iconography.
  - `useFreshGasParams` custom hook — fetches the latest block before every `writeContract` call to compute a dynamic `maxFeePerGas` (baseFee × 1.5), avoiding the "max fee per gas less than block base fee" revert on Arbitrum.
- **State Management**: React Query (via wagmi) for blockchain state.

## Key Flows

### Contract Initialization (post-deploy)
1. After every deploy, `initialize(usdcAddress)` **must** be called once.
2. Use `apps/contracts-stylus/initialize.sh` (reads `.env.deploy`).
3. Without this step, `usdcAddress()` returns `0x000...000` and all deposits revert with an absurd gas estimate in MetaMask.

### Session Creation
1. User connects wallet.
2. User specifies: amount, deadline, voting period, participants.
3. `createSession` is called with fresh gas params from `useFreshGasParams`.
4. On success the modal closes automatically; state is reset via `resetWrite()` on reopen.

### Participation (Deposit Flow)
1. Participant navigates to Session ID.
2. **If allowance < amountPerPerson:** calls `approve` on USDC contract with fresh gas.
3. On `approve` confirmation: re-fetches allowance from chain, then calls `deposit` with a **new** fresh gas fetch.
4. Both steps use `useFreshGasParams` independently to avoid stale fee estimates.

### Voting
1. After `deadline`, participants open the voting window.
2. `castVote(sessionId, absentAddress)` is called with fresh gas params.
3. Errors from wagmi (rejection, gas failure) are surfaced via the `error` property of `useWriteContract`, handled in `useEffect`.

### Settlement
1. After `deadline + votingPeriod`, `finalizeSession` is callable.
2. Called with fresh gas params from `useFreshGasParams`.
3. `refetch()` is triggered via `useEffect([isFinSuccess])`, not during render.

## Directory Structure
- `apps/contracts-stylus/src/lib.rs`: Main contract logic.
- `apps/contracts-stylus/deploy.sh`: Deploy script (reads `.env.deploy`).
- `apps/contracts-stylus/initialize.sh`: Post-deploy initialization script — calls `initialize(usdcAddress)` on the deployed contract.
- `apps/frontend/src/app`: Next.js pages.
- `apps/frontend/src/app/welcome/page.tsx`: Demo landing/dashboard with sectioned UX, animated overlays, and image-based hero.
- `apps/frontend/src/components`: Reusable UI components.
- `apps/frontend/src/abi`: Contract ABIs and addresses.
- `apps/frontend/src/hooks/useFreshGasParams.ts`: Custom hook that fetches the latest block and returns dynamic `maxFeePerGas`/`maxPriorityFeePerGas` to pass into every `writeContract` call.
- `apps/frontend/src/config/wagmi.ts`: wagmi config (single chain: Arbitrum Sepolia, injected + WalletConnect connectors).

## UX Notes
- Session stats in `session/[id]` were refactored to a 2x2 layout for better scanability.
- Landing content is split into discrete sections (overview, metrics, flow, value props, CTA, FAQ) to improve storytelling and readability in demos.
- Landing uses a discrete grid background layer to preserve a technical look while keeping contrast and readability.
