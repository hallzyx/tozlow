"use client";

import { useConnect, useDisconnect } from "wagmi";
import { useState } from "react";
import { X, Wallet, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isOpen) return null;

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (connector) {
      connect({ connector });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass mx-4 w-full max-w-md rounded-2xl border border-[var(--color-glass-border)] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">
            Conectar wallet
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-[var(--color-surface)] transition-colors"
          >
            <X className="size-5 text-[var(--color-muted)]" />
          </button>
        </div>

        {/* Connectors */}
        <div className="space-y-3">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector.id)}
              disabled={isPending}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl p-4",
                "bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)]",
                "border border-[var(--color-border)]",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "group"
              )}
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                <Wallet className="size-5 text-[var(--color-primary)]" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-[var(--color-foreground)]">
                  {connector.name}
                </div>
                <div className="text-sm text-[var(--color-muted)]">
                  {connector.id === "injected" && "MetaMask, OKX, etc."}
                  {connector.id === "walletConnect" && "WalletConnect"}
                </div>
              </div>
              <ExternalLink className="size-4 text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--color-muted)]">
            Al conectar tu wallet, aceptas nuestros términos de servicio.
          </p>
        </div>
      </div>
    </div>
  );
}