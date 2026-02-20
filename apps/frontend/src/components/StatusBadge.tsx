import { cn } from "@/lib/utils";
import { Hourglass, Activity, CheckSquare, Lock, Banknote, CheckCircle, LucideIcon } from "lucide-react";

type Status = "waiting" | "active" | "voting" | "voting-closed" | "refunded" | "finalized";

const STATUS_CONFIG: Record<
  Status,
  { label: string; icon: LucideIcon; classes: string; iconColor?: string }
> = {
  waiting: {
    label: "Waiting for deposits",
    icon: Hourglass,
    classes:
      "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/30",
  },
  active: {
    label: "Active",
    icon: Activity,
    classes:
      "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/30",
  },
  voting: {
    label: "Voting",
    icon: CheckSquare,
    classes:
      "bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border-[var(--color-secondary)]/30",
  },
  "voting-closed": {
    label: "Voting Closed",
    icon: Lock,
    classes:
      "bg-[var(--color-border)]/40 text-[var(--color-foreground)] border-[var(--color-border)]",
  },
  refunded: {
    label: "Refunded",
    icon: Banknote,
    classes:
      "bg-[var(--color-border)]/50 text-[var(--color-foreground)] border-[var(--color-border)]",
  },
  finalized: {
    label: "Finalized",
    icon: CheckCircle,
    classes:
      "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.waiting;
  const Icon = config.icon;
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm",
        config.classes,
        className
      )}
    >
      <Icon className="size-3.5" />
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
