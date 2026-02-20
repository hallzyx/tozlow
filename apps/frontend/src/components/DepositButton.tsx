"use client";

import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi";
import { parseUnits, parseGwei } from "viem";
import type { Address } from "viem";
import { tozlowAbi, TOZLOW_ADDRESS, erc20Abi, USDC_ADDRESS } from "@/abi/TozlowSession";
import { cn, parseContractError, formatUsdc } from "@/lib/utils";
import { Coins, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface DepositButtonProps {
  sessionId: bigint;
  amountPerPerson: bigint;
}

export function DepositButton({ sessionId, amountPerPerson }: DepositButtonProps) {
  const { address } = useAccount();
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "depositing" | "done">("idle");

  // Approve USDC
  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending } = useWriteContract();
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Deposit
  const { writeContract: writeDeposit, data: depositHash, isPending: isDepositPending } = useWriteContract();
  const { isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  // ¿Ya depositó?
  const { data: alreadyDeposited } = useReadContract({
    address: TOZLOW_ADDRESS,
    abi: tozlowAbi,
    functionName: "hasDeposited",
    args: sessionId && address ? [sessionId, address] : undefined,
    query: { enabled: !!address },
  });

  // Allowance actual
  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, TOZLOW_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  if (isDepositSuccess || alreadyDeposited) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-[var(--color-accent-glow)] border border-[var(--color-accent)]/30 px-4 py-3 text-[var(--color-accent)]">
        <CheckCircle2 className="size-5" />
        <span className="text-sm font-semibold">Depósito confirmado ✅</span>
      </div>
    );
  }

  async function handleApproveAndDeposit() {
    setError("");

    const needsApproval = !allowance || allowance < amountPerPerson;

    if (needsApproval) {
      setStep("approving");
      try {
        writeApprove({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [TOZLOW_ADDRESS, amountPerPerson],
          maxFeePerGas: parseGwei('50'),
          maxPriorityFeePerGas: parseGwei('2'),
        });
      } catch (err) {
        setError(parseContractError(err));
        setStep("idle");
      }
    } else {
      handleDeposit();
    }
  }

  function handleDeposit() {
    setStep("depositing");
    try {
      writeDeposit({
        address: TOZLOW_ADDRESS,
        abi: tozlowAbi,
        functionName: "deposit",
        args: [sessionId],
        maxFeePerGas: parseGwei('50'),
        maxPriorityFeePerGas: parseGwei('2'),
      });
    } catch (err) {
      setError(parseContractError(err));
      setStep("idle");
    }
  }

  // Auto-depositar tras approve exitoso
  if (isApproveSuccess && step === "approving") {
    handleDeposit();
  }

  const isLoading = isApprovePending || isDepositPending || step === "approving";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3">
        <div>
          <p className="text-xs text-[var(--color-muted)]">Tu depósito</p>
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
            {step === "approving" ? "Aprobando USDC…" : "Depositando…"}
          </>
        ) : (
          <>
            <Coins className="size-4" />
            Depositar y unirme
          </>
        )}
      </button>

      <p className="text-[11px] text-center text-[var(--color-muted)]">
        Primero aprobamos USDC y luego depositamos en el contrato — 2 txs.
      </p>
    </div>
  );
}
