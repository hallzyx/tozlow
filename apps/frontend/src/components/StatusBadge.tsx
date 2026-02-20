import { cn } from "@/lib/utils";

type Status = "waiting" | "active" | "voting" | "voting-closed" | "refunded" | "finalized";

const STATUS_CONFIG: Record<
  Status,
  { label: string; emoji: string; classes: string }
> = {
  waiting: {
    label: "Esperando depósitos",
    emoji: "⏳",
    classes:
      "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/30",
  },
  active: {
    label: "Activa",
    emoji: "🟢",
    classes:
      "bg-[var(--color-accent-glow)] text-[var(--color-accent)] border-[var(--color-accent)]/30",
  },
  voting: {
    label: "En votación",
    emoji: "🗳️",
    classes:
      "bg-[var(--color-secondary-glow)] text-[var(--color-secondary)] border-[var(--color-secondary)]/30",
  },
  "voting-closed": {
    label: "Votación cerrada",
    emoji: "🔒",
    classes:
      "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/30",
  },
  refunded: {
    label: "Reembolsada",
    emoji: "💸",
    classes:
      "bg-[var(--color-border)] text-[var(--color-muted)] border-[var(--color-border)]",
  },
  finalized: {
    label: "Finalizada",
    emoji: "✅",
    classes:
      "bg-[var(--color-border)] text-[var(--color-muted)] border-[var(--color-border)]",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium",
        config.classes,
        className
      )}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}

export function getSessionStatus(params: {
  active: boolean;
  finalized: boolean;
  deadline: bigint | number;
  votingDeadline?: bigint | number;
}): Status {
  const { active, finalized, deadline, votingDeadline } = params;
  const now = Math.floor(Date.now() / 1000);
  const deadlineNum = typeof deadline === "bigint" ? Number(deadline) : deadline;
  const votingEnd = votingDeadline
    ? (typeof votingDeadline === "bigint" ? Number(votingDeadline) : votingDeadline)
    : deadlineNum + 3600; // fallback 1h

  if (finalized) return "finalized";
  if (now >= votingEnd) return "voting-closed";
  if (now >= deadlineNum && active) return "voting";
  if (now >= deadlineNum && !active) return "voting-closed"; // not all deposited, past deadline
  if (!active) return "waiting";
  return "active";
}
