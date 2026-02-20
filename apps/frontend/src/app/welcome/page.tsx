"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  Rocket,
  ShieldCheck,
  Sparkles,
  Wallet,
  Vote,
  Trophy,
  ArrowRight,
  Coins,
  Users,
  BarChart3,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const flow = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Sign in with your wallet and access your on-chain sessions instantly.",
  },
  {
    icon: Coins,
    title: "Stake with Friends",
    description: "Create a session and set a USDC stake that keeps everyone accountable.",
  },
  {
    icon: Vote,
    title: "Vote Attendance",
    description: "After the event, attendees vote transparently on no-shows.",
  },
  {
    icon: Trophy,
    title: "Auto Settlement",
    description: "Funds are distributed on-chain by smart contract rules.",
  },
];

const metrics = [
  { label: "Avg setup time", value: "< 2 min", icon: Timer },
  { label: "Ideal group size", value: "3–5", icon: Users },
  { label: "On-chain logic", value: "100%", icon: BarChart3 },
  { label: "Trust model", value: "Transparent", icon: ShieldCheck },
];

const faqs = [
  {
    q: "Do I need crypto experience to use Tozlow?",
    a: "No. The flow is simple: connect wallet, join session, deposit, and vote. The UI guides each step.",
  },
  {
    q: "What happens if not everyone deposits?",
    a: "The session does not become active. Depositors are protected and refunds are handled by contract logic.",
  },
  {
    q: "Can someone cheat during voting?",
    a: "Votes are on-chain and each participant has strict constraints. The settlement is deterministic.",
  },
];

export default function WelcomePage() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const blobA = useRef<HTMLDivElement | null>(null);
  const blobB = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!blobA.current || !blobB.current) return;

    const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } });
    tl.to(blobA.current, { x: 30, y: -20, duration: 4 }, 0)
      .to(blobB.current, { x: -35, y: 25, duration: 5 }, 0);

    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const setMouseVars = (x: number, y: number) => {
      root.style.setProperty("--grid-mx", `${x}px`);
      root.style.setProperty("--grid-my", `${y}px`);
    };

    setMouseVars(window.innerWidth * 0.68, window.innerHeight * 0.24);

    const handleMove = (event: MouseEvent) => {
      setMouseVars(event.clientX, event.clientY);
    };

    const handleLeave = () => {
      setMouseVars(window.innerWidth * 0.68, window.innerHeight * 0.24);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("blur", handleLeave);
    document.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("blur", handleLeave);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div ref={pageRef} className="relative overflow-hidden animate-fade-in">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] transition-opacity duration-300"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(220px circle at var(--grid-mx, 68%) var(--grid-my, 24%), black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(220px circle at var(--grid-mx, 68%) var(--grid-my, 24%), black, transparent 72%)",
        }}
      />
      <div
        ref={blobA}
        className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--color-primary-glow)" }}
      />
      <div
        ref={blobB}
        className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "var(--color-accent-glow)" }}
      />

      <div className="relative z-10 mx-auto max-w-6xl space-y-12">
      <section className="relative glass rounded-3xl border border-[var(--color-glass-border)] p-8 sm:p-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -left-16 top-8 h-px w-64 rotate-12 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-70" />
          <div className="absolute -left-10 top-16 h-px w-52 rotate-12 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-60 blur-[0.6px]" />
          <div className="absolute right-[-70px] bottom-20 h-px w-72 -rotate-[24deg] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-55" />
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            
            <span className="inline-flex items-center gap-2 rounded-pill border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-foreground)] opacity-90 mb-4">
              <Sparkles className="size-3.5 text-[var(--color-primary)]" />
              New social finance experience
            </span>

            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Show up with your friends.
              <span className="block text-gradient-primary">Or lose your stake.</span>
            </h1>

            <p className="text-[var(--color-foreground)] opacity-80 text-base sm:text-lg mb-8">
              Tozlow makes meetups accountable with USDC stakes, transparent voting, and automatic on-chain settlement.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold",
                  "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]",
                  "text-[var(--color-primary-foreground)] hover:opacity-90 transition-all glow-primary"
                )}
              >
                Try the App <ArrowRight className="size-4" />
              </Link>

              <a
                href="https://sepolia.arbiscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-medium hover:border-[var(--color-primary)]/40 transition-colors"
              >
                View network
              </a>
            </div>
          </motion.div>

        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className=""
        >
            <style>{`
            @keyframes spinGradient {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            `}</style>

            <div
            className="relative rounded-xl overflow-hidden"
            style={{
                // outer padding creates the visible "border" area
                padding: "2px",
                borderRadius: "0.75rem", // matches rounded-xl
            }}
            >
            {/* rotating gradient layer only (behind the content) */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                borderRadius: "0.75rem",
                background:
                    "conic-gradient(from 0deg, var(--color-primary), var(--color-secondary), var(--color-accent), var(--color-primary))",
                animation: "spinGradient 6s linear infinite",
                filter: "saturate(1.05)",
                zIndex: 0,
                }}
            />

            <div
                className="relative overflow-hidden border border-[var(--color-border)]"
                style={{ borderRadius: "calc(0.75rem - 2px)", background: "var(--color-surface)", zIndex: 10 }}
            >
                <img
                src="https://images.unsplash.com/photo-1556392714-1d7b65410650?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NzIxMzR8MHwxfHNlYXJjaHwzfHxmcmllbmRzJTIwbWVldHVwJTIwZGlzY3Vzc2lvbiUyMGNvZmZlZSUyMHRhYmxlfGVufDB8MHx8fDE3NzE2MTcxMzZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Friends meeting and talking together"
                className="h-80 w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[var(--color-background)]/70 via-transparent to-[var(--color-primary)]/25" />
            </div>
            </div>
        </motion.div>
        </div>
      </section>

      <SectionDivider />

      <section>
        <SectionHeading title="At a glance" subtitle="The key numbers that communicate speed, trust, and scale." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.article
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="glass rounded-xl border border-[var(--color-glass-border)] p-4"
              >
                <Icon className="size-4 text-[var(--color-primary)] mb-2" />
                <p className="text-xl font-bold font-display leading-none mb-1">{m.value}</p>
                <p className="text-xs text-[var(--color-foreground)] opacity-70">{m.label}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <SectionDivider />

      <section>
        <SectionHeading title="How it works" subtitle="A clean 4-step flow from wallet connection to settlement." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flow.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="glass rounded-2xl border border-[var(--color-glass-border)] p-5"
              >
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <Icon className="size-5 text-[var(--color-primary)]" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-[var(--color-foreground)] opacity-75">{item.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <SectionDivider />

      <section>
        <SectionHeading title="Why this feels premium" subtitle="Message clarity and trust cues designed for demo audiences." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6">
          <h2 className="font-display text-xl font-bold mb-3">Built for groups that value commitment</h2>
          <ul className="space-y-2 text-sm text-[var(--color-foreground)] opacity-80">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 mt-0.5 text-[var(--color-success)]" />
              Dinner plans, sports meetups, study groups, and creator collabs.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 mt-0.5 text-[var(--color-success)]" />
              Simple social rule: if you commit, show up.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 mt-0.5 text-[var(--color-success)]" />
              No manual accounting after the event.
            </li>
          </ul>
        </div>

        <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-6">
          <h2 className="font-display text-xl font-bold mb-3">Designed for trust at a glance</h2>
          <ul className="space-y-2 text-sm text-[var(--color-foreground)] opacity-80">
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 mt-0.5 text-[var(--color-accent)]" />
              On-chain status and deterministic settlement.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 mt-0.5 text-[var(--color-accent)]" />
              Clear progression from session creation to payout.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 mt-0.5 text-[var(--color-accent)]" />
              Mobile-first cards and compact readability.
            </li>
          </ul>
        </div>
      </div>
      </section>

      <SectionDivider />

      <section>
        <SectionHeading title="Decision section" subtitle="The final push: confidence + immediate call to action." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl border border-[var(--color-glass-border)] p-5 lg:col-span-2">
          <h2 className="font-display text-xl font-bold mb-2">Why viewers love this dashboard</h2>
          <ul className="space-y-2 text-sm text-[var(--color-foreground)] opacity-80">
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 mt-0.5 text-[var(--color-success)]" />
              Strong contrast and clear hierarchy for quick scanning.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 mt-0.5 text-[var(--color-success)]" />
              Motion adds delight without hurting readability.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="size-4 mt-0.5 text-[var(--color-success)]" />
              Designed to guide the user directly to "Try the App".
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-glow)] p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--color-primary)] font-semibold mb-2">Ready</p>
          <h3 className="font-display text-xl font-bold mb-3">Start your first session</h3>
          <p className="text-sm text-[var(--color-foreground)] opacity-80 mb-4">
            Invite friends, set the stake, and test the full flow in minutes.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <Rocket className="size-4" />
            Launch Tozlow
          </Link>
        </div>
      </div>
      </section>

      <SectionDivider />

      <section className="glass rounded-2xl border border-[var(--color-glass-border)] p-6">
        <SectionHeading title="FAQ" subtitle="Fast answers for first-time users and judges." />
        <h2 className="font-display text-2xl font-bold mb-4">FAQ</h2>
        <div className="space-y-2">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                <span>{item.q}</span>
                <ArrowRight className="size-4 opacity-60" />
              </summary>
              <p className="mt-2 text-sm text-[var(--color-foreground)] opacity-75">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}

function SectionEyebrow({ title }: { title: string }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-primary)] font-semibold mb-3">{title}</p>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="text-sm text-[var(--color-foreground)] opacity-75 mt-1">{subtitle}</p>
    </div>
  );
}

function SectionDivider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />;
}
