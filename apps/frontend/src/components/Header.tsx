"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useReadContract } from "wagmi";
import { arbitrumSepolia, arbitrum } from "wagmi/chains";
import { formatEther } from "viem";
import { useMounted } from "@/hooks/useMounted";
import { erc20Abi, USDC_ADDRESS } from "@/abi/TozlowSession";
import { formatUsdc, shortAddress, cn } from "@/lib/utils";
import { Wallet, Zap, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { createPublicClient, http } from "viem";
import { ConnectModal } from "./ConnectModal";

export function Header() {
  const mounted = useMounted();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showMenu, setShowMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Saldo USDC
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Saldo ETH (Sepolia)
  // Mostrado como "saldo Sepolia ETH"
  const isWrongNetwork = isConnected && chain?.id !== arbitrumSepolia.id;

  if (!mounted) return <HeaderSkeleton />;

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-b border-[var(--color-glass-border)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <span className="font-display text-xl font-bold text-gradient-primary">
                Tozlow
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isWrongNetwork && (
                <div className="flex items-center gap-2">
                  <span className="rounded-pill bg-[var(--color-destructive)]/20 px-3 py-1 text-xs font-medium text-[var(--color-destructive)]">
                    Cambiar a Arbitrum Sepolia
                  </span>
                  <button
                    onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
                    className="rounded-pill bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-3 py-1 text-xs font-medium hover:opacity-90 transition-colors"
                  >
                    Cambiar red
                  </button>
                </div>
              )}

              {isConnected && address ? (
                <div className="flex items-center gap-2">
                  {/* Saldo USDC */}
                  {usdcBalance !== undefined && (
                    <div className="hidden sm:flex items-center gap-1.5 rounded-pill bg-[var(--color-usdc-bg)] px-3 py-1.5">
                      <span className="text-[10px] font-bold text-[var(--color-usdc)] uppercase tracking-wider">USDC</span>
                      <span className="text-sm font-semibold text-[var(--color-usdc)]">
                        {formatUsdc(usdcBalance)}
                      </span>
                    </div>
                  )}

                  {/* Red badge */}
                  <div className="hidden sm:flex items-center gap-1.5 rounded-pill bg-[var(--color-secondary-glow)] px-3 py-1.5">
                    <Zap className="size-3 text-[var(--color-secondary)]" />
                    <span className="text-xs font-medium text-[var(--color-secondary)]">
                      Arb Sepolia
                    </span>
                  </div>

                  {/* Address menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className={cn(
                        "flex items-center gap-2 rounded-pill px-3 py-2",
                        "bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)]",
                        "border border-[var(--color-border)]",
                        "text-sm font-medium transition-colors"
                      )}
                    >
                      <span className="size-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                      <span className="hidden sm:block">{shortAddress(address)}</span>
                      <ChevronDown className="size-3.5 text-[var(--color-muted)]" />
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 glass rounded-lg border border-[var(--color-glass-border)] p-1 shadow-lg animate-fade-in">
                        <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                          <p className="text-xs text-[var(--color-muted)]">Conectado como</p>
                          <p className="text-sm font-mono font-medium truncate">{shortAddress(address)}</p>
                          {usdcBalance !== undefined && (
                            <p className="text-xs text-[var(--color-usdc)] mt-0.5">
                              {formatUsdc(usdcBalance)} USDC
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => { disconnect(); setShowMenu(false); }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
                        >
                          <LogOut className="size-4" />
                          Desconectar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConnectModal(true)}
                  className={cn(
                    "flex items-center gap-2 rounded-pill px-4 py-2",
                    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
                    "font-semibold text-sm",
                    "hover:opacity-90 transition-all glow-primary",
                    "animate-pulse-glow"
                  )}
                >
                  <Wallet className="size-4" />
                  Conectar wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </header>
  );
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass border-b border-[var(--color-glass-border)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <span className="font-display text-xl font-bold text-gradient-primary">Tozlow</span>
            </div>
            <div className="h-9 w-36 rounded-pill shimmer-bg" />
          </div>
        </div>
      </div>
    </header>
  );
}
