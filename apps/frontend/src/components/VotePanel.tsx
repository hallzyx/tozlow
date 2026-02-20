"use client";

import { useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi";
import { parseGwei } from "viem";
import type { Address } from "viem";
import { tozlowAbi, TOZLOW_ADDRESS } from "@/abi/TozlowSession";
import { cn, parseContractError, shortAddress } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, ThumbsDown } from "lucide-react";

interface VotePanelProps {
  sessionId: bigint;
  participants: Address[];
  deadline: bigint;
  votingEnd: bigint;
}

export function VotePanel({ sessionId, participants, deadline, votingEnd }: VotePanelProps) {
  const { address } = useAccount();
  const [selectedAbsent, setSelectedAbsent] = useState<Address | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const now = Math.floor(Date.now() / 1000);
  const isVotingOpen = now >= Number(deadline) && now < Number(votingEnd);
  const remainingMinutes = Math.max(0, Math.floor((Number(votingEnd) - now) / 60));

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // ¿Ya votó el caller?
  const { data: hasVoted, refetch: refetchVoted } = useReadContract({
    address: TOZLOW_ADDRESS,
    abi: tozlowAbi,
    functionName: "hasVoted",
    args: sessionId !== undefined && address ? [sessionId, address] : undefined,
    query: { enabled: !!address },
  });

  if (isSuccess && !successMsg) {
    setSuccessMsg("¡Voto registrado en la cadena! 🗳️");
    refetchVoted();
  }

  async function handleVote() {
    if (!selectedAbsent) return;
    setError("");
    try {
      writeContract({
        address: TOZLOW_ADDRESS,
        abi: tozlowAbi,
        functionName: "castVote",
        args: [sessionId, selectedAbsent],
        maxFeePerGas: parseGwei('50'),
        maxPriorityFeePerGas: parseGwei('2'),
      });
    } catch (err) {
      setError(parseContractError(err));
    }
  }

  if (!isVotingOpen) {
    return (
      <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 text-center">
        <p className="text-[var(--color-muted)] text-sm">
          La votación abre cuando llegue la fecha del evento ⏳
        </p>
      </div>
    );
  }

  if (successMsg) {
    return (
      <div className="rounded-xl bg-[var(--color-accent-glow)] border border-[var(--color-accent)]/30 p-5 text-center">
        <CheckCircle2 className="size-8 text-[var(--color-accent)] mx-auto mb-2" />
        <p className="font-semibold text-[var(--color-accent)]">{successMsg}</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-[var(--color-glass-border)] p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <ThumbsDown className="size-5 text-[var(--color-destructive)]" />
        <h3 className="font-display font-bold text-base">¿Quién faltó?</h3>
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        Vota por quién no apareció. Si la mayoría coincide, ese participante pierde su depósito.
      </p>
      {isVotingOpen && remainingMinutes > 0 && (
        <div className="rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 px-3 py-2 text-xs text-[var(--color-warning)]">
          ⏱️ Quedan ~{remainingMinutes} min para votar. ¡Quien no vote será marcado ausente!
        </div>
      )}

      {/* Lista de participantes */}
      <div className="space-y-2">
        {participants
          .filter((p) => p.toLowerCase() !== address?.toLowerCase())
          .map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedAbsent(p === selectedAbsent ? null : p)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl px-4 py-3",
                "border transition-all text-sm font-mono",
                selectedAbsent === p
                  ? "border-[var(--color-destructive)] bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40"
              )}
            >
              <span>{shortAddress(p)}</span>
              {selectedAbsent === p && <XCircle className="size-4" />}
            </button>
          ))}
      </div>

      {error && (
        <div className="rounded-xl bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 px-4 py-3 text-sm text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      <button
        onClick={handleVote}
        disabled={!selectedAbsent || isPending || isConfirming}
        className={cn(
          "w-full rounded-xl py-3 font-semibold text-sm",
          "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]",
          "hover:opacity-90 transition-all",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2"
        )}
      >
        {isPending || isConfirming ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {isPending ? "Confirmando…" : "En la cadena…"}
          </>
        ) : (
          "Registrar mi voto"
        )}
      </button>
    </div>
  );
}
