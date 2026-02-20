import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BaseError, ContractFunctionRevertedError } from "viem";

// ---- Class helper ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Format USDC (6 decimals) ----
export function formatUsdc(amount: bigint): string {
  const decimals = 6n;
  const divisor = 10n ** decimals;
  const integer = amount / divisor;
  const fractional = amount % divisor;
  const padded = fractional.toString().padStart(Number(decimals), "0");
  return `${integer}.${padded.slice(0, 2)}`;
}

// ---- Format address short ----
export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ---- Format timestamp as local date ----
export function formatDeadline(timestamp: bigint | number): string {
  const ms = typeof timestamp === "bigint" ? Number(timestamp) * 1000 : timestamp * 1000;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

// ---- Parse contract error to user-friendly string ----
export function parseContractError(error: unknown): string {
  if (!error) return "Unknown error";
  const msg = error instanceof Error ? error.message : String(error);

  if (error instanceof BaseError) {
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      const messages: Record<string, string> = {
        NotParticipant: "You are not a participant of this session.",
        AlreadyDeposited: "You already deposited.",
        DeadlineReached: "The meeting date has passed.",
        DeadlineNotReached: "The meeting date hasn't arrived yet.",
        AlreadyFinalized: "This session is already finalized.",
        NotEnoughParticipants: "Minimum 3 participants.",
        TooManyParticipants: "Maximum 5 participants.",
        TransferFailed: "Error transferring USDC. Did you approve the amount?",
        AlreadyVoted: "You already voted in this session.",
        InvalidAbsent: "That address is not a participant.",
        NotAllDeposited: "Not everyone successfully deposited yet.",
        VotingNotOpen: "Voting window hasn't opened yet.",
        VotingClosed: "Voting window is already closed.",
        SessionNotActive: "Session is not active (missing deposits).",
        CannotVoteSelf: "You cannot vote for yourself.",
      };
      if (name && messages[name]) return messages[name];
    }
  }

  if (msg.includes("User rejected")) return "Transaction cancelled.";
  return msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
}

// ---- Transaction state type ----
export type TxState =
  | { status: "idle" }
  | { status: "pending"; message?: string }
  | { status: "confirming"; hash: string }
  | { status: "success"; hash: string }
  | { status: "error"; message: string };
