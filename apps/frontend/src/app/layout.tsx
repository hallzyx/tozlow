import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/Header";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tozlow — Stake on showing up",
  description:
    "Create sessions with friends. No-shows lose their USDC deposit. Built on Arbitrum.",
  keywords: ["web3", "arbitrum", "usdc", "dapp", "friends", "staking"],
  openGraph: {
    title: "Tozlow",
    description: "Did you say you were coming? Then show up.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          <Header />
          <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
