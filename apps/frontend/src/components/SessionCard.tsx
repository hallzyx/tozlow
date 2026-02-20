"use client";

import Link from "next/link";
import { formatUsdc, formatDeadline, cn } from "@/lib/utils";
import { StatusBadge, getSessionStatus } from "./StatusBadge";
import { Users, Clock, Coins, ArrowRight } from "lucide-react";

export interface SessionCardProps {
  sessionId: bigint;
  host: `0x${string}`;
  amountPerPerson: bigint;
  deadline: bigint;
  votingPeriod: bigint;
  finalized: boolean;
  active: boolean;
  participantCount: number;
  depositedCount: number;
  isHost?: boolean;
}

export function SessionCard({
  sessionId,
  amountPerPerson,
  deadline,
  votingPeriod,
  finalized,
  active,
  participantCount,
  depositedCount,
  isHost,
}: SessionCardProps) {
  const votingDeadline = deadline + votingPeriod;
  const status = getSessionStatus({ active, finalized, deadline, votingDeadline });
  const sessionLabel = `Sesión #${sessionId.toString()}`;

  return (
    <Link href={`/session/${sessionId.toString()}`}>
      <article
        className={cn(
          "group relative glass rounded-xl p-5 transition-all duration-300",
          "hover:border-[var(--color-primary)]/40 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_oklch(72%_0.28_310_/_20%)]",
          "cursor-pointer select-none"
        )}
      >
        {/* Glow de fondo al hover */}
        <div className="absolute inset-0 rounded-xl bg-[var(--color-primary-glow)] opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10" />

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-bold truncate text-[var(--color-foreground)] group-hover:text-gradient-primary transition-all">
              {sessionLabel}
            </h3>
            {isHost && (
              <span className="inline-block mt-0.5 text-[10px] font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                👑 Eres el host
              </span>
            )}
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatChip
            icon={<Coins className="size-3.5" />}
            label="Por persona"
            value={`${formatUsdc(amountPerPerson)} USDC`}
            color="usdc"
          />
          <StatChip
            icon={<Users className="size-3.5" />}
            label="Participantes"
            value={`${depositedCount}/${participantCount}`}
            color="secondary"
          />
          <StatChip
            icon={<Clock className="size-3.5" />}
            label="Fecha"
            value={formatDeadline(deadline)}
            color="primary"
          />
        </div>

        {/* Deposit progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-[var(--color-muted)]">
            <span>Depósitos</span>
            <span>{depositedCount}/{participantCount}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] transition-all duration-500"
              style={{
                width: `${(depositedCount / participantCount) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight className="absolute right-4 bottom-4 size-4 text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
      </article>
    </Link>
  );
}

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "secondary" | "usdc";
}) {
  const colorMap = {
    primary: "text-[var(--color-primary)] bg-[var(--color-primary-glow)]",
    secondary: "text-[var(--color-secondary)] bg-[var(--color-secondary-glow)]",
    usdc: "text-[var(--color-usdc)] bg-[var(--color-usdc-bg)]",
  };

  return (
    <div className={cn("rounded-lg p-2 text-center", colorMap[color])}>
      <div className="flex justify-center mb-0.5 opacity-70">{icon}</div>
      <p className="text-[10px] text-[var(--color-muted)] mb-0.5">{label}</p>
      <p className="text-xs font-semibold leading-tight">{value}</p>
    </div>
  );
}
