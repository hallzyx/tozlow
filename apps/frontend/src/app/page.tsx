"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { tozlowAbi, TOZLOW_ADDRESS } from "@/abi/TozlowSession";
import { SessionCard } from "@/components/SessionCard";
import { CreateSessionModal } from "@/components/CreateSessionModal";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { Plus, Wallet, PartyPopper, Loader2 } from "lucide-react";
import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import type { Address } from "viem";

// Tipo liviano de sesión para la lista
interface SessionSummary {
  sessionId: bigint;
  host: `0x${string}`;
  amountPerPerson: bigint;
  deadline: bigint;
  votingPeriod: bigint;
  finalized: boolean;
  active: boolean;
  participantCount: number;
  depositedCount: number;
}

export default function HomePage() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const [modalOpen, setModalOpen] = useState(false);
  const [shouldReloadSessions, setShouldReloadSessions] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const rpcUrl =
    process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC ??
    "https://sepolia-rollup.arbitrum.io/rpc";

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(rpcUrl),
  });

  // Leer sessionCount y luego iterar sobre las sesiones
  async function loadSessions() {
    if (!address) return;
    setLoading(true);
    try {
      const totalSessions = (await publicClient.readContract({
        address: TOZLOW_ADDRESS,
        abi: tozlowAbi,
        functionName: "sessionCount",
      })) as bigint;

      const userSessions: SessionSummary[] = [];

      for (let i = 0n; i < totalSessions; i++) {
        // Leer estado de la sesión
        const result = await publicClient.readContract({
          address: TOZLOW_ADDRESS,
          abi: tozlowAbi,
          functionName: "getSession",
          args: [i],
        });

        const [host, amount, deadline, votingPeriod, finalized, active, participantCount] = result as [
          Address, bigint, bigint, bigint, boolean, boolean, bigint
        ];

        // Leer participantes
        const pCount = Number(participantCount);
        const participants: Address[] = [];
        for (let j = 0; j < pCount; j++) {
          const p = (await publicClient.readContract({
            address: TOZLOW_ADDRESS,
            abi: tozlowAbi,
            functionName: "getParticipantAt",
            args: [i, BigInt(j)],
          })) as Address;
          participants.push(p);
        }

        // Filtrar solo sesiones donde el usuario es participante
        const isParticipant = participants
          .map((p) => p.toLowerCase())
          .includes(address.toLowerCase());
        if (!isParticipant) continue;

        // Contar depósitos
        let depositedCount = 0;
        for (const p of participants) {
          const dep = await publicClient.readContract({
            address: TOZLOW_ADDRESS,
            abi: tozlowAbi,
            functionName: "hasDeposited",
            args: [i, p],
          });
          if (dep) depositedCount++;
        }

        userSessions.push({
          sessionId: i,
          host: host as `0x${string}`,
          amountPerPerson: amount,
          deadline,
          votingPeriod,
          finalized,
          active,
          participantCount: pCount,
          depositedCount,
        });
      }

      setSessions(userSessions.reverse()); // más recientes primero
    } catch (e) {
      console.error("Error loading sessions", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (address) loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Recargar sesiones después de crear una nueva (con delay para RPC sync)
  useEffect(() => {
    if (shouldReloadSessions) {
      setShouldReloadSessions(false);
      // Pequeño delay para que el RPC se sincronice después de la transacción
      const timer = setTimeout(() => {
        loadSessions();
      }, 2000); // 2 segundos de delay
      return () => clearTimeout(timer);
    }
  }, [shouldReloadSessions]);

  if (!mounted) return null;

  // --- No conectado ---
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="text-6xl mb-6 animate-pulse-glow">🎉</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
          <span className="text-gradient-primary">¿Vas o no vas?</span>
        </h1>
        <p className="text-[var(--color-muted)] text-lg max-w-sm mb-2">
          Crea una sesión con tus amigos y penaliza con USDC a quien diga que va y no aparezca.
        </p>
        <p className="text-[var(--color-muted)] text-sm mb-10">
          Construido en{" "}
          <span className="text-[var(--color-secondary)] font-semibold">Arbitrum Sepolia</span>{" "}
          con Stylus.
        </p>
        <div className="flex items-center gap-2 text-[var(--color-muted)] text-sm">
          <Wallet className="size-4" />
          Conecta tu wallet para empezar
        </div>
      </div>
    );
  }

  // --- Conectado ---
  return (
    <div className="animate-fade-in">
      {/* Hero row */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Mis sesiones{" "}
            <span className="text-gradient-primary">{sessions.length > 0 ? `(${sessions.length})` : ""}</span>
          </h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            Tus reuniones activas y pasadas en la cadena
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5",
            "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]",
            "text-[var(--color-primary-foreground)] font-semibold text-sm",
            "hover:opacity-90 transition-all glow-primary"
          )}
        >
          <Plus className="size-4" />
          <span className="hidden sm:block">Nueva sesión</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 text-[var(--color-primary)] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && sessions.length === 0 && (
        <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-12 text-center animate-slide-up">
          <PartyPopper className="size-12 text-[var(--color-primary)] mx-auto mb-4 opacity-80" />
          <h3 className="font-display text-lg font-bold mb-2">
            Aún no tienes sesiones
          </h3>
          <p className="text-[var(--color-muted)] text-sm mb-6">
            Crea la primera y compártela con tus amigos.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
              "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]",
              "text-[var(--color-primary-foreground)] font-semibold text-sm",
              "hover:opacity-90 transition-all glow-primary"
            )}
          >
            <Plus className="size-4" />
            Crear primera sesión
          </button>
        </div>
      )}

      {/* Sessions grid */}
      {!loading && sessions.length > 0 && (() => {
        const now = Math.floor(Date.now() / 1000);
        const activeSessions = sessions.filter((s) => {
          const votingEnd = Number(s.deadline) + Number(s.votingPeriod);
          return !s.finalized && now < votingEnd;
        });
        const expiredSessions = sessions.filter((s) => {
          const votingEnd = Number(s.deadline) + Number(s.votingPeriod);
          return s.finalized || now >= votingEnd;
        });

        return (
          <div className="space-y-8 animate-slide-up">
            {/* Sesiones activas */}
            {activeSessions.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                  🟢 Sesiones activas ({activeSessions.length})
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeSessions.map((s) => (
                    <SessionCard
                      key={s.sessionId.toString()}
                      {...s}
                      isHost={s.host.toLowerCase() === address?.toLowerCase()}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sesiones expiradas / finalizadas */}
            {expiredSessions.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                  📋 Historial ({expiredSessions.length})
                </h2>
                <div className="grid sm:grid-cols-2 gap-4 opacity-80">
                  {expiredSessions.map((s) => (
                    <SessionCard
                      key={s.sessionId.toString()}
                      {...s}
                      isHost={s.host.toLowerCase() === address?.toLowerCase()}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Create session modal */}
      <CreateSessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          setShouldReloadSessions(true);
        }}
      />
    </div>
  );
}
