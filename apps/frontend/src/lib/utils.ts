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
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

// ---- Parse contract error to user-friendly string ----
export function parseContractError(error: unknown): string {
  if (!error) return "Error desconocido";
  const msg = error instanceof Error ? error.message : String(error);

  if (error instanceof BaseError) {
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      const messages: Record<string, string> = {
        NotParticipant: "No eres participante de esta sesión.",
        AlreadyDeposited: "Ya hiciste tu depósito.",
        DeadlineReached: "La fecha de la reunión ya pasó.",
        DeadlineNotReached: "La reunión aún no ha llegado.",
        AlreadyFinalized: "Esta sesión ya fue finalizada.",
        NotEnoughParticipants: "Mínimo 3 participantes.",
        TooManyParticipants: "Máximo 5 participantes.",
        TransferFailed: "Error al transferir USDC. ¿Aprobaste el monto?",
        AlreadyVoted: "Ya votaste en esta sesión.",
        InvalidAbsent: "Esa dirección no es participante.",
        NotAllDeposited: "No todos han depositado aún.",
        VotingNotOpen: "La ventana de votación aún no ha abierto.",
        VotingClosed: "La ventana de votación ya cerró.",
        SessionNotActive: "La sesión no está activa (faltan depósitos).",
        CannotVoteSelf: "No puedes votar por ti mismo.",
      };
      if (name && messages[name]) return messages[name];
    }
  }

  if (msg.includes("User rejected")) return "Transacción cancelada.";
  return msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
}

// ---- Transaction state type ----
export type TxState =
  | { status: "idle" }
  | { status: "pending"; message?: string }
  | { status: "confirming"; hash: string }
  | { status: "success"; hash: string }
  | { status: "error"; message: string };
