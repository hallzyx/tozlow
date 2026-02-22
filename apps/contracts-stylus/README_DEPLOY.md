# Stylus Contract Deployment (TozlowSession)

1) Add a local environment file in this folder (do not commit it):
   - Copy `.env.deploy.example` -> `.env.deploy`

2) Fill in the values:
   PRIVATE_KEY=0x...
   ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY

3) From the root of the repo, deploy:

```bash
pnpm --filter contracts-stylus run deploy:testnet
```

4) Copy the deployed contract address to `apps/frontend/.env.local`:
   NEXT_PUBLIC_TOZLOW_ADDRESS=0x<new_address>

5) **⚠️ Initialize the contract (MANDATORY):**
   Without this step, the contract has `usdcAddress = 0x000...000` and all
   deposits will revert with an absurd gas estimation in MetaMask.

```bash
CONTRACT_ADDRESS=0x<new_address> ./apps/contracts-stylus/initialize.sh
```

   The script reads `PRIVATE_KEY` and `ARBITRUM_SEPOLIA_RPC_URL` from `.env.deploy`
   and verifies that `usdcAddress()` returns the correct address upon completion.

Security notes:
- Use a test account, not your main account.
- The `.env.deploy` file should never be committed (it is in `.gitignore`).
- The script clears `PRIVATE_KEY` from the environment when finished using `unset PRIVATE_KEY`.
