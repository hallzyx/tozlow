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
- **Motion & Visual Layer**: Framer Motion + GSAP + Three.js (`/welcome` route).
- **Web3 Integration**:
  - `wagmi` for React hooks.
  - `viem` for low-level interaction.
  - `lucide-react` for iconography (replacing emojis).
- **State Management**: React Query (via wagmi) for blockchain state.

## Key Flows

### Session Creation
1. User connects wallet.
2. User specifies: Name/ID implicitly generated, Amount, Deadline, Participants.
3. Contract `createSession` is called.

### Participation
1. Participant navigates to Session ID.
2. Participant calls `approve` on USDC contract.
3. Participant calls `deposit` on Tozlow contract.

### Settlement
1. After deadline, voting opens.
2. Participants cast votes on absentees.
3. `finalizeSession` is called to execute transfers based on votes.

## Directory Structure
- `apps/contracts-stylus/src/lib.rs`: Main contract logic.
- `apps/frontend/src/app`: Next.js pages.
- `apps/frontend/src/app/welcome/page.tsx`: Demo landing/dashboard with sectioned UX and animated 3D hero.
- `apps/frontend/src/components`: Reusable UI components.
- `apps/frontend/src/abi`: Contract ABIs and addresses.

## UX Notes
- Session stats in `session/[id]` were refactored to a 2x2 layout for better scanability.
- Landing content is split into discrete sections (overview, metrics, flow, value props, CTA, FAQ) to improve storytelling and readability in demos.
