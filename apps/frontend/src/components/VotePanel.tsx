"use client";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi";
import type { Address } from "viem";
import { tozlowAbi, TOZLOW_ADDRESS } from "@/abi/TozlowSession";
import { cn, parseContractError, shortAddress } from "@/lib/utils";
import { useFreshGasParams } from "@/hooks/useFreshGasParams";
import { CheckCircle2, XCircle, Loader2, ThumbsDown, Timer } from "lucide-react";

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
  const getFreshGasParams = useFreshGasParams();

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Has voted?
  const { data: hasVoted, refetch: refetchVoted } = useReadContract({
    address: TOZLOW_ADDRESS,
    abi: tozlowAbi,
    functionName: "hasVoted",
    args: sessionId !== undefined && address ? [sessionId, address] : undefined,
    query: { enabled: !!address },
  });

  // Mover side-effects fuera del render
  useEffect(() => {
    if (isSuccess) {
      setSuccessMsg("Vote registered on-chain!");
      refetchVoted();
    }
  }, [isSuccess, refetchVoted]);

  useEffect(() => {
    if (writeError) {
      setError(parseContractError(writeError));
    }
  }, [writeError]);

  async function handleVote() {
    if (!selectedAbsent) return;
    setError("");
    const gasParams = await getFreshGasParams();
    writeContract({
      address: TOZLOW_ADDRESS,
      abi: tozlowAbi,
      functionName: "castVote",
      args: [sessionId, selectedAbsent],
      ...gasParams,
    });
  }

  if (hasVoted || successMsg) {
    return (
      <div className="rounded-xl bg-[var(--color-accent-glow)] border border-[var(--color-accent)]/30 p-5 text-center">
        <CheckCircle2 className="size-8 text-[var(--color-accent)] mx-auto mb-2" />
        <p className="font-semibold text-[var(--color-accent)]">
          {successMsg || "You already voted in this session."}
        </p>
      </div>
    );
  }

  if (!isVotingOpen) {
    return (
      <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-[var(--color-foreground)] opacity-80">
          <Timer className="size-4 text-[var(--color-warning)]" />
          <span>Voting opens when the event starts.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-[var(--color-glass-border)] p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <ThumbsDown className="size-5 text-[var(--color-destructive)]" />
        <h3 className="font-display font-bold text-base">Who is missing?</h3>
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        Vote for who didn't show up. If the majority agrees, that participant loses their deposit.
      </p>
      {isVotingOpen && remainingMinutes > 0 && (
        <div className="rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 px-3 py-2 text-xs text-[var(--color-warning)] flex items-center gap-2">
           <Timer className="size-3.5" />
           <span>~{remainingMinutes} mins left to vote. Non-voters will be marked absent!</span>
        </div>
      )}

      {/* Participants List */}
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
            {isPending ? "Confirming…" : "On-chain…"}
          </>
        ) : (
          "Cast my vote"
        )}
      </button>
    </div>
  );
}
