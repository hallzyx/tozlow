# Tozlow Session Creation Flow 🎉

## Executive Summary

Tozlow is a dApp that allows creating **group accountability sessions** where participants deposit USDC as a guarantee of attendance to agreed-upon events. If someone flakes, they lose their deposit, which is distributed among those who attended.

## Complete Session Creation Flow

### 1. Wallet Connection
**Mandatory initial step**

- The user must connect their wallet using the "Connect wallet" button in the header.
- A modal appears with options:
  - **Injected**: For wallets like MetaMask, OKX, etc.
  - **WalletConnect**: For connection via QR code.
- If the wallet is not on **Arbitrum Sepolia**, a "Switch to Arbitrum Sepolia" message appears with a button to switch automatically.

**Validations:**
- Wallet must be connected.
- Must be on the correct network (Arbitrum Sepolia).

### 2. Accessing the Creation Modal
**Location:** "New session" button on the main page.

- Located in the main section of the app.
- Only visible when the wallet is connected and on the correct network.

### 3. Session Configuration

#### 3.1 Amount per Participant
**Mandatory field**
- **Type:** Decimal number (USDC has 6 decimals).
- **Minimum value:** 0.01 USDC.
- **Default value:** 1.00 USDC.
- **Format:** Numeric input with 0.01 step.

**Considerations:**
- This amount will be deposited by each participant.
- If someone flakes, they lose this amount.
- The amount is distributed among the attendees.

#### 3.2 Deadline Date and Time
**Mandatory field**
- **Date:** `date` type input (YYYY-MM-DD).
- **Time:** `time` type input (HH:MM).
- **Internal format:** Unix Timestamp (seconds).

**Validations:**
- The date/time must be in the future.
- Past dates are not allowed.

#### 3.3 Participants
**Mandatory field**
- **Minimum:** 3 total participants (host + 2 friends).
- **Maximum:** 5 total participants (host + 4 friends).
- **Format:** Ethereum addresses (`0x...`).

**Structure:**
- The **host** (creator) is added automatically.
- Fields to add friends' wallets (2-4 fields).
- Each participant must have a valid address.

**Interface:**
- Text field for each participant.
- "+" button to add a participant.
- "🗑️" button to remove a participant.
- Visual indicator for the host.

### 4. Transaction Submission
**Action:** "Create session" button.

**Parameters sent to the contract:**
```solidity
createSession(
    uint256 amountPerPerson,    // Amount in USDC (6 decimals)
    uint256 deadline,           // Unix Timestamp
    uint256 votingPeriod,       // Voting window in seconds
    address[] participants      // Array of addresses
)
```

**Dynamic Gas:**
Before sending the transaction, the frontend queries the latest block to calculate `maxFeePerGas = baseFee × 1.5`. This prevents the *"max fee per gas less than block base fee"* error that occurs on Arbitrum when the base fee rises between the estimation and block inclusion.

**States during submission:**
1. **Pending:** `isPending = true` → Shows spinner + "Confirming in wallet…"
2. **Confirming:** `isConfirming = true` → Waits for blockchain confirmation + "On chain Request…"
3. **Success:** `isSuccess = true` → Modal closes automatically, `onSuccess` callback.
4. **Error:** `writeError` from the hook → Error message shown in the form, state reset.

### 5. Post-Creation

#### 5.1 UI Update
- The modal closes automatically.
- The session list on the main page is updated.
- The new session appears with a unique ID.

#### 5.2 Session State
**Stored information:**
- **Session ID:** `uint256` (auto-incremental).
- **Host:** Creator's address.
- **Amount per person:** In USDC wei.
- **Deadline:** Unix Timestamp.
- **Participants:** Array of addresses.
- **State:** `active = true`, `finalized = false`.

#### 5.3 Next Steps for Participants
Once the session is created, participants can:

1. **Deposit USDC** → Call `deposit(sessionId)`.
2. **View state** → Query `getSession(sessionId)`.
3. **Vote absences** → After the deadline, call `castVote(sessionId, absent)`.
4. **Finalize** → The host can call `finalizeSession(sessionId)`.

## Error States

### Validation Errors (frontend)
- **"Connect your wallet first"**: Wallet not connected.
- **"You need at least 2 more friends (3 total)"**: Less than 3 participants.
- **"The date must be in the future"**: Invalid or past date/time.

### Wagmi/Network Errors
- `writeContract` errors (user rejection, gas estimation failure) are caught via the `error` property of the `useWriteContract` hook in a `useEffect`, not with synchronous `try/catch`.
- The modal state is reset with `resetWrite()` when reopened to prevent dirty states from a previous TX from blocking the form.

### Contract Errors
- **Contract Reverts**: Parsed with `parseContractError` and show readable messages.
- **`AlreadyInitialized`**: The contract was already initialized, cannot call `initialize` again.
- **`NotParticipant`**: The wallet is not in the participant list for that session.
- **`DeadlineReached`**: The session timestamp has already expired, cannot deposit.

## User Interface

### Modal Design
- **Style:** Glass morphism with backdrop blur.
- **Animations:** `animate-slide-up` on open.
- **Responsive:** `max-w-lg` centered.
- **Theme:** Custom CSS variables colors.

### Form Fields
- **Labels with icons:** Coins, Calendar, Users.
- **Focus states:** Colored borders per field.
- **Visual validation:** Red error messages.
- **Loading states:** Spinners during transactions.

### Visual Feedback
- **Success:** Modal closes automatically.
- **Error:** Red message below the form.
- **Loading:** Disabled button with spinner.

## Technical Considerations

### Smart Contract Integration
- **ABI:** `tozlowAbi` imported from `@/abi/TozlowSession`.
- **Address:** `TOZLOW_ADDRESS` from environment variable `NEXT_PUBLIC_TOZLOW_ADDRESS`.
- **Hooks:** `useWriteContract` + `useWaitForTransactionReceipt`.
- **Initialization:** The contract requires calling `initialize(usdcAddress)` once after deploy (see `initialize.sh`). Without this, all deposits fail.

### Dynamic Gas
- `useFreshGasParams` hook in `src/hooks/useFreshGasParams.ts`.
- Queries `eth_getBlockByNumber("latest")` right before each `writeContract`.
- Calculates `maxFeePerGas = baseFee × 1.5` and `maxPriorityFeePerGas = 0.001 gwei`.
- Applied in: `createSession`, `approve`, `deposit`, `castVote`, `finalizeSession`.

### State Management
- **Local state:** `useState` for form fields.
- **Error handling:** Hook `error` property + `useEffect` (no synchronous `try/catch`).
- **Reset:** `resetWrite()` when reopening the modal and before each submit to clear dirty states.
- **Success callback:** Updates parent session list.

### Deposit Flow (2 transactions)
1. **Approve:** `USDC.approve(TOZLOW_ADDRESS, amount)` with fresh gas.
2. Waits for on-chain confirmation via `useWaitForTransactionReceipt`.
3. **Deposit:** re-fetches `allowance` + gets new fresh gas → `deposit(sessionId)`.
4. Step 3 occurs in a `useEffect([isApproveSuccess])` with a `ref` guard to prevent double calls.

### Frontend Validations
- **Type checking:** TypeScript for addresses `0x${string}[]`.
- **Numeric format:** `parseUnits(amount, 6)` for USDC.
- **Timestamp:** Conversion from local date/time to Unix timestamp.

## Participant Flow

### To join an existing session:
1. View active sessions on the main page.
2. Click on a session.
3. View details and participants.
4. Deposit USDC if a participant.
5. Wait for the deadline.
6. Vote for absences.
7. Claim rewards if applicable.

### Possible session states:
- **Active:** Collecting deposits.
- **Finalized:** Voting completed, funds distributed.
- **Expired:** Deadline passed, waiting for finalization.

## Conclusion

The session creation flow in Tozlow is designed to be **intuitive and secure**, with multiple validations on both the frontend and smart contract. The interface guides the user step by step, ensuring all necessary conditions are met before creating a binding session on the blockchain.