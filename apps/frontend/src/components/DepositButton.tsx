"use client";

import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
  usePublicClient,
} from "wagmi";
import { tozlowAbi, TOZLOW_ADDRESS, erc20Abi, USDC_ADDRESS } from "@/abi/TozlowSession";
import { cn, parseContractError, formatUsdc } from "@/lib/utils";
import { Coins, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface DepositButtonProps {
  sessionId: bigint;
  amountPerPerson: bigint;
}

export function DepositButton({ sessionId, amountPerPerson }: DepositButtonProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "depositing" | "done">("idle");
  const depositTriggered = useRef(false);

  // Obtiene el maxFeePerGas fresco del bloque actual para evitar
  // el error "max fee per gas less than block base fee" en Arbitrum.
  async function getFreshGasParams() {
    if (!publicClient) return {};
    try {
      const block = await publicClient.getBlock({ blockTag: "latest" });
      const baseFee = block.baseFeePerGas ?? 20_000_000n; // fallback 0.02 gwei
      // +50% de buffer sobre el base fee actual
      const maxFeePerGas = (baseFee * 3n) / 2n;
      // Priority fee mínimo en Arbitrum (no secuenciador lo requiere, pero sí > 0)
      const maxPriorityFeePerGas = 1_000_000n; // 0.001 gwei
      return { maxFeePerGas, maxPriorityFeePerGas };
    } catch {
      return {};
    }
  }

  // Approve USDC
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Deposit
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError,
    reset: resetDeposit,
  } = useWriteContract();
  const { isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  // Has deposited?
  const { data: alreadyDeposited } = useReadContract({
    address: TOZLOW_ADDRESS,
    abi: tozlowAbi,
    functionName: "hasDeposited",
    args: sessionId !== undefined && address ? [sessionId, address] : undefined,
    query: { enabled: !!address },
  });

  // Current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, TOZLOW_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // Handle approve errors (user rejection, gas estimation, etc.)
  useEffect(() => {
    if (approveError) {
      setError(parseContractError(approveError));
      setStep("idle");
    }
  }, [approveError]);

  // Handle deposit errors
  useEffect(() => {
    if (depositError) {
      setError(parseContractError(depositError));
      setStep("idle");
    }
  }, [depositError]);

  // Auto-deposit after successful approve — in a useEffect, NOT during render
  useEffect(() => {
    if (isApproveSuccess && step === "approving" && !depositTriggered.current) {
      depositTriggered.current = true;
      // Refetch allowance + fees frescos del bloque actual antes de depositar
      Promise.all([refetchAllowance(), getFreshGasParams()]).then(([, gasParams]) => {
        setStep("depositing");
        writeDeposit({
          address: TOZLOW_ADDRESS,
          abi: tozlowAbi,
          functionName: "deposit",
          args: [sessionId],
          ...gasParams,
        });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveSuccess, step, sessionId, refetchAllowance, writeDeposit]);

  if (isDepositSuccess || alreadyDeposited) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-[var(--color-accent-glow)] border border-[var(--color-accent)]/30 px-4 py-3 text-[var(--color-accent)]">
        <CheckCircle2 className="size-5" />
        <span className="text-sm font-semibold">Deposit confirmed</span>
      </div>
    );
  }

  async function handleApproveAndDeposit() {
    setError("");
    depositTriggered.current = false;
    resetApprove();
    resetDeposit();

    const gasParams = await getFreshGasParams();
    const needsApproval = allowance === undefined || allowance < amountPerPerson;

    if (needsApproval) {
      setStep("approving");
      writeApprove({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [TOZLOW_ADDRESS, amountPerPerson],
        ...gasParams,
      });
    } else {
      // Already approved, go straight to deposit
      setStep("depositing");
      writeDeposit({
        address: TOZLOW_ADDRESS,
        abi: tozlowAbi,
        functionName: "deposit",
        args: [sessionId],
        ...gasParams,
      });
    }
  }

  const isLoading = isApprovePending || isDepositPending || step === "approving";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3">
        <div>
          <p className="text-xs text-[var(--color-muted)]">Your deposit</p>
          <p className="text-lg font-bold font-display text-gradient-primary">
            {formatUsdc(amountPerPerson)} USDC
          </p>
        </div>
        <Coins className="size-8 text-[var(--color-usdc)] opacity-60" />
      </div>

      {error && (
        <div className="rounded-xl bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 px-4 py-3 text-sm text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      <button
        onClick={handleApproveAndDeposit}
        disabled={isLoading || !address}
        className={cn(
          "w-full rounded-xl py-3 font-semibold text-sm",
          "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]",
          "text-[var(--color-primary-foreground)]",
          "hover:opacity-90 transition-all glow-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {step === "approving" ? "Approving USDC…" : "Depositing…"}
          </>
        ) : (
          <>
            <Coins className="size-4" />
            Deposit & Join
          </>
        )}
      </button>

      <p className="text-[11px] text-center text-[var(--color-foreground)] opacity-75">
        First approve USDC, then deposit — 2 transactions.
      </p>
    </div>
  );
}
