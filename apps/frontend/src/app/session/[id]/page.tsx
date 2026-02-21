"use client";

import { useParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { tozlowAbi, TOZLOW_ADDRESS } from "@/abi/TozlowSession";
import { useMounted } from "@/hooks/useMounted";
import { StatusBadge, getSessionStatus } from "@/components/StatusBadge";
import { DepositButton } from "@/components/DepositButton";
import { VotePanel } from "@/components/VotePanel";
import { formatUsdc, formatDeadline, shortAddress, parseContractError, cn } from "@/lib/utils";
import { useFreshGasParams } from "@/hooks/useFreshGasParams";
import {
  ArrowLeft, Users, Coins, Calendar, Copy, CheckCircle2,
  Loader2, Trophy, ExternalLink, Crown, Lock,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function SessionPage() {
  const params = useParams();
  const sessionIdStr = params.id as string;
  const sessionId = BigInt(sessionIdStr);
  const { address } = useAccount();
  const mounted = useMounted();
  const [copied, setCopied] = useState(false);
  const [finalizeError, setFinalizeError] = useState("");
  const [allParticipants, setAllParticipants] = useState<Address[]>([]);
  const [loadingParts, setLoadingParts] = useState(true);

  const publicClient = usePublicClient();
  const getFreshGasParams = useFreshGasParams();

  // Read session data
  const { data: sessionData, isLoading: loadingSession, refetch } = useReadContract({
    address: TOZLOW_ADDRESS,
    abi: tozlowAbi,
    functionName: "getSession",
    args: [sessionId],
  });

  // Read participants iterating getParticipantAt
  useEffect(() => {
    async function fetchParticipants() {
      if (!sessionData) return;
      const [, , , , , , participantCount] = sessionData as [Address, bigint, bigint, bigint, boolean, boolean, bigint];
      const pCount = Number(participantCount);
      const parts: Address[] = [];
      for (let i = 0; i < pCount; i++) {
        const p = (await publicClient.readContract({
          address: TOZLOW_ADDRESS,
          abi: tozlowAbi,
          functionName: "getParticipantAt",
          args: [sessionId, BigInt(i)],
        })) as Address;
        parts.push(p);
      }
      setAllParticipants(parts);
      setLoadingParts(false);
    }
    fetchParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData]);

  // Finalize session
  const {
    writeContract: writeFinalize,
    data: finalHash,
    isPending: isFinalizePending,
    error: finalizeWriteError,
  } = useWriteContract();
  const { isLoading: isFinConfirming, isSuccess: isFinSuccess } = useWaitForTransactionReceipt({ hash: finalHash });

  useEffect(() => {
    if (isFinSuccess) refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinSuccess]);

  useEffect(() => {
    if (finalizeWriteError) setFinalizeError(parseContractError(finalizeWriteError));
  }, [finalizeWriteError]);

  if (!mounted || loadingSession || loadingParts) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <p className="text-[var(--color-muted)]">Session not found.</p>
        <Link href="/" className="text-[var(--color-primary)] text-sm mt-2 inline-block">
          ← Back
        </Link>
      </div>
    );
  }

  const [host, amountPerPerson, deadline, votingPeriod, finalized, active, participantCount] = sessionData as [
    Address, bigint, bigint, bigint, boolean, boolean, bigint
  ];
  const sessionLabel = `Session #${sessionId.toString()}`;
  const votingEnd = deadline + votingPeriod;

  const status = getSessionStatus({ active, finalized, deadline, votingDeadline: votingEnd });
  const isHost = host?.toLowerCase() === address?.toLowerCase();
  const isParticipant = allParticipants
    .map((p) => p.toLowerCase())
    .includes(address?.toLowerCase() ?? "");
  const now = Math.floor(Date.now() / 1000);
  const isVotingOpen = now >= Number(deadline) && now < Number(votingEnd) && active;
  const isVotingClosed = now >= Number(votingEnd);
  const canFinalize = isVotingClosed && !finalized;

  function copyId() {
    navigator.clipboard.writeText(sessionId.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFinalize() {
    setFinalizeError("");
    const gasParams = await getFreshGasParams();
    writeFinalize({
      address: TOZLOW_ADDRESS,
      abi: tozlowAbi,
      functionName: "finalizeSession",
      args: [sessionId],
      ...gasParams,
    });
  }

  const arbiscanUrl = `https://sepolia.arbiscan.io/address/${TOZLOW_ADDRESS}`;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        My Sessions
      </Link>

      {/* Header card */}
      <div className="glass rounded-2xl border border-[var(--color-glass-border)] overflow-hidden mb-5">
        {/* Gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)]" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold truncate">{sessionLabel}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--color-muted)]">Host:</span>
                <span className="text-xs font-mono text-[var(--color-muted)] flex items-center gap-1">
                  {shortAddress(host)}
                  {isHost && (
                    <span className="inline-flex items-center gap-0.5 ml-1 text-[var(--color-primary)] font-semibold">
                       <Crown className="size-3" /> (you)
                    </span>
                  )}
                </span>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <InfoCard
              icon={<Coins className="size-4 text-[var(--color-usdc)]" />}
              label="Per person"
              value={`${formatUsdc(amountPerPerson)} USDC`}
              accent="usdc"
            />
            <InfoCard
              icon={<Users className="size-4 text-[var(--color-secondary)]" />}
              label="Participants"
              value={`${allParticipants.length}`}
              accent="secondary"
            />
            <InfoCard
              icon={<Calendar className="size-4 text-[var(--color-primary)]" />}
              label="Event Date"
              value={formatDeadline(deadline)}
              accent="primary"
            />
            <InfoCard
              icon={<Calendar className="size-4 text-[var(--color-primary)]" />}
              label="Voting Closes"
              value={formatDeadline(votingEnd)}
              accent="primary"
            />
          </div>

          {/* Session ID */}
          <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2">
            <span className="text-[11px] text-[var(--color-foreground)] opacity-75 shrink-0">Session ID:</span>
            <span className="text-[11px] font-mono text-[var(--color-foreground)] opacity-75 truncate flex-1">
              #{sessionId.toString()}
            </span>
            <button
              onClick={copyId}
              className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              {copied ? <CheckCircle2 className="size-3.5 text-[var(--color-accent)]" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6 mb-5">
        <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
          <Users className="size-5 text-[var(--color-secondary)]" />
          Participants ({allParticipants.length})
        </h2>
        <div className="space-y-2">
          {allParticipants.map((p, idx) => (
            <ParticipantRow
              key={p}
              address={p}
              sessionId={sessionId}
              isYou={p.toLowerCase() === address?.toLowerCase()}
              isHost={p.toLowerCase() === host.toLowerCase()}
              idx={idx}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      {isParticipant && (
        <div className="space-y-4">
          {/* Deposit (only before deadline and not deposited yet) */}
          {now < Number(deadline) && !finalized && (
            <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6">
              <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
                <Coins className="size-5 text-[var(--color-usdc)]" />
                Your Deposit
              </h2>
              <DepositButton
                sessionId={sessionId}
                amountPerPerson={amountPerPerson}
              />
            </div>
          )}

          {/* Vote (during voting window) */}
          {isVotingOpen && !finalized && (
            <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6">
              <VotePanel
                sessionId={sessionId}
                participants={allParticipants}
                deadline={deadline}
                votingEnd={votingEnd}
              />
            </div>
          )}

          {/* Info: Voting closed, pending finalize */}
          {isVotingClosed && !finalized && (
            <div className="glass rounded-2xl border border-[var(--color-warning)]/30 p-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-[var(--color-foreground)] opacity-85 mb-1">
                <Lock className="size-4 text-[var(--color-warning)]" />
                <span>Voting window closed. Non-voters will be marked absent automatically.</span>
              </div>
            </div>
          )}

          {/* Finalize */}
          {canFinalize && (
            <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="size-5 text-[var(--color-warning)]" />
                <h2 className="font-display font-bold text-base">Resolve Session</h2>
              </div>
              <p className="text-sm text-[var(--color-muted)] mb-4">
                {active 
                  ? "Finalize session to distribute funds. Those who didn't vote will be marked absent."
                  : "Not everyone deposited. Refunds will be issued to those who did."
                }
              </p>
              {finalizeError && (
                <div className="rounded-xl bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 px-4 py-3 text-sm text-[var(--color-destructive)] mb-3">
                  {finalizeError}
                </div>
              )}
              <button
                onClick={handleFinalize}
                disabled={isFinalizePending || isFinConfirming}
                className={cn(
                  "w-full rounded-xl py-3 font-semibold text-sm",
                  "bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-accent)]",
                  "text-[var(--color-primary-foreground)]",
                  "hover:opacity-90 transition-all",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                {isFinalizePending || isFinConfirming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    Finalize and distribute funds <Trophy className="size-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Finalized */}
          {finalized && (
            <div className="glass rounded-2xl border border-[var(--color-accent)]/30 p-6 text-center">
              <CheckCircle2 className="size-10 text-[var(--color-accent)] mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg mb-1">Session Finalized</h3>
              <p className="text-sm text-[var(--color-muted)] mb-4">
                Funds have been distributed on-chain.
              </p>
              <a
                href={arbiscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-secondary)] hover:opacity-70 transition-opacity"
              >
                View on Arbiscan
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Sub-components ----

function InfoCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "primary" | "secondary" | "usdc";
}) {
  const colorMap = {
    primary: "bg-[var(--color-primary-glow)] text-[var(--color-primary)]",
    secondary: "bg-[var(--color-secondary-glow)] text-[var(--color-secondary)]",
    usdc: "bg-[var(--color-usdc-bg)] text-[var(--color-usdc)]",
  };
  return (
    <div className={cn("rounded-xl p-3 text-center", colorMap[accent])}>
      <div className="flex justify-center mb-1 opacity-70">{icon}</div>
      <p className="text-[10px] text-[var(--color-foreground)] opacity-75 mb-0.5">{label}</p>
      <p className="text-xs font-semibold leading-tight">{value}</p>
    </div>
  );
}

function ParticipantRow({
  address: addr,
  sessionId,
  isYou,
  isHost,
  idx,
}: {
  address: Address;
  sessionId: bigint;
  isYou: boolean;
  isHost: boolean;
  idx: number;
}) {
  const { data: deposited } = useReadContract({
    address: TOZLOW_ADDRESS,
    abi: tozlowAbi,
    functionName: "hasDeposited",
    args: [sessionId, addr],
  });

  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="size-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
          {idx + 1}
        </span>
        <div>
          <p className="text-xs font-mono">{shortAddress(addr)}</p>
          <div className="flex gap-1 mt-0.5">
            {isHost && (
              <span className="text-[9px] text-[var(--color-primary)] font-semibold uppercase flex items-center gap-0.5">
                <Crown className="size-2.5" /> host
              </span>
            )}
            {isYou && (
              <span className="text-[9px] text-[var(--color-secondary)] font-semibold uppercase">
                · you
              </span>
            )}
          </div>
        </div>
      </div>
      <div>
        {deposited ? (
          <span className="flex items-center gap-1 text-[11px] text-[var(--color-accent)] font-semibold">
            <CheckCircle2 className="size-3.5" /> Deposited
          </span>
        ) : (
          <span className="text-[11px] text-[var(--color-foreground)] opacity-70">Pending</span>
        )}
      </div>
    </div>
  );
}
