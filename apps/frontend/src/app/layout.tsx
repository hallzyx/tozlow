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
  title: "Tozlow 🎉 — Penaliza al que falta",
  description:
    "Crea sesiones con tus amigos. Quien no aparece, pierde su depósito en USDC. Construido en Arbitrum.",
  keywords: ["web3", "arbitrum", "usdc", "dapp", "amigos", "apuesta"],
  openGraph: {
    title: "Tozlow 🎉",
    description: "¿Dijiste que ibas? Entonces vas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
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
