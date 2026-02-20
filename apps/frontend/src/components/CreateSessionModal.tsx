"use client";

import { useState, useEffect, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseUnits, parseGwei } from "viem";
import { tozlowAbi, TOZLOW_ADDRESS } from "@/abi/TozlowSession";
import { cn, parseContractError } from "@/lib/utils";
import { X, Plus, Trash2, Calendar, Users, Coins, Loader2 } from "lucide-react";

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateSessionModal({
  open,
  onClose,
  onSuccess,
}: CreateSessionModalProps) {
  const { address } = useAccount();

  const [amountUsdc, setAmountUsdc] = useState("1");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("20:00");
  const [votingMinutes, setVotingMinutes] = useState("60");
  // Participantes (excl. el host, que se agrega automático)
  const [participants, setParticipants] = useState<string[]>(["", ""]);
  const [error, setError] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const hasHandledSuccess = useRef(false);

  function addParticipant() {
    if (participants.length < 4) setParticipants([...participants, ""]);
  }

  function removeParticipant(idx: number) {
    setParticipants(participants.filter((_, i) => i !== idx));
  }

  function updateParticipant(idx: number, value: string) {
    const updated = [...participants];
    updated[idx] = value;
    setParticipants(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!address) { setError("Conecta tu wallet primero."); return; }

    const allParticipants = [
      address,
      ...participants.filter((p) => p.trim().length > 0),
    ] as `0x${string}`[];

    if (allParticipants.length < 3) {
      setError("Necesitas al menos 2 amigos más (3 total).");
      return;
    }

    const deadlineTimestamp = Math.floor(
      new Date(`${deadlineDate}T${deadlineTime}:00`).getTime() / 1000
    );
    if (isNaN(deadlineTimestamp) || deadlineTimestamp <= Date.now() / 1000) {
      setError("La fecha tiene que ser en el futuro.");
      return;
    }

    const amountWei = parseUnits(amountUsdc || "1", 6);
    const votingPeriodSeconds = BigInt(Math.max(1, parseInt(votingMinutes) || 60) * 60);

    try {
      writeContract({
        address: TOZLOW_ADDRESS,
        abi: tozlowAbi,
        functionName: "createSession",
        args: [amountWei, BigInt(deadlineTimestamp), votingPeriodSeconds, allParticipants],
        maxFeePerGas: parseGwei('50'),
        maxPriorityFeePerGas: parseGwei('2'),
      });
    } catch (err) {
      setError(parseContractError(err));
    }
  }

  // Cerrar al confirmar
  useEffect(() => {
    if (isSuccess && hash && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      onSuccess?.();
      onClose();
    }
  }, [isSuccess, hash]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass rounded-2xl border border-[var(--color-glass-border)] shadow-[var(--shadow-card)] animate-slide-up overflow-hidden">
        {/* Decorative gradient top */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)]" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold">Nueva sesión 🎉</h2>
              <p className="text-sm text-[var(--color-muted)] mt-0.5">
                Crea la apuesta para tu próxima reunión
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Monto USDC */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Coins className="size-4 text-[var(--color-usdc)]" />
                Monto por persona (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amountUsdc}
                  onChange={(e) => setAmountUsdc(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="1.00"
                  className={cn(
                    "w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]",
                    "px-4 py-2.5 text-sm pr-16",
                    "focus:outline-none focus:border-[var(--color-usdc)] focus:ring-1 focus:ring-[var(--color-usdc)]/50",
                    "transition-colors"
                  )}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-usdc)]">
                  USDC
                </span>
              </div>
            </div>

            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="size-4 text-[var(--color-secondary)]" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className={cn(
                    "w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]",
                    "px-3 py-2.5 text-sm",
                    "focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]/50",
                    "transition-colors"
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Hora</label>
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className={cn(
                    "w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]",
                    "px-3 py-2.5 text-sm",
                    "focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]/50",
                    "transition-colors"
                  )}
                />
              </div>
            </div>

            {/* Tiempo de votación */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                🗳️ Tiempo de votación (minutos)
              </label>
              <input
                type="number"
                value={votingMinutes}
                onChange={(e) => setVotingMinutes(e.target.value)}
                min="5"
                step="5"
                placeholder="60"
                className={cn(
                  "w-full rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]",
                  "px-4 py-2.5 text-sm",
                  "focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)]/50",
                  "transition-colors"
                )}
              />
              <p className="text-[11px] text-[var(--color-muted)]">
                Ventana para votar después de la hora del evento. Quien no vote será marcado ausente.
              </p>
            </div>

            {/* Participantes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Users className="size-4 text-[var(--color-primary)]" />
                Wallets de tus amigos
              </label>
              <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 space-y-2">
                {/* Host (autoagregado) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs rounded-pill bg-[var(--color-primary-glow)] text-[var(--color-primary)] px-2 py-0.5 font-semibold">
                    Tú (host)
                  </span>
                  <span className="text-xs font-mono text-[var(--color-muted)] truncate flex-1">
                    {address ?? "..."}
                  </span>
                </div>

                {participants.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-muted)] w-4 text-center">{idx + 2}</span>
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => updateParticipant(idx, e.target.value)}
                      placeholder="0x..."
                      className={cn(
                        "flex-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]",
                        "px-3 py-1.5 text-xs font-mono",
                        "focus:outline-none focus:border-[var(--color-primary)]/60",
                        "transition-colors"
                      )}
                    />
                    {participants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(idx)}
                        className="text-[var(--color-destructive)] hover:opacity-70 transition-opacity"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}

                {participants.length < 4 && (
                  <button
                    type="button"
                    onClick={addParticipant}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:opacity-70 transition-opacity mt-1"
                  >
                    <Plus className="size-3.5" />
                    Agregar amigo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[var(--color-muted)]">
                De 3 a 5 participantes total (incluido tú).
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 px-4 py-3 text-sm text-[var(--color-destructive)]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className={cn(
                "w-full rounded-xl py-3 font-semibold text-sm",
                "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]",
                "text-[var(--color-primary-foreground)]",
                "hover:opacity-90 transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isPending ? "Confirmando en wallet…" : "En la cadena…"}
                </>
              ) : (
                "Crear sesión 🚀"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
