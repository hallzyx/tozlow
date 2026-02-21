"use client";

import { usePublicClient } from "wagmi";

/**
 * Devuelve una función que consulta el bloque más reciente y calcula
 * maxFeePerGas con un 50% de buffer sobre el baseFee actual.
 * Evita el error "max fee per gas less than block base fee" en Arbitrum.
 */
export function useFreshGasParams() {
  const publicClient = usePublicClient();

  return async function getFreshGasParams(): Promise<{
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }> {
    if (!publicClient) return {};
    try {
      const block = await publicClient.getBlock({ blockTag: "latest" });
      const baseFee = block.baseFeePerGas ?? 20_000_000n; // fallback 0.02 gwei
      // +50% de buffer sobre el baseFee del bloque actual
      const maxFeePerGas = (baseFee * 3n) / 2n;
      const maxPriorityFeePerGas = 1_000_000n; // 0.001 gwei mínimo en Arbitrum
      return { maxFeePerGas, maxPriorityFeePerGas };
    } catch {
      return {};
    }
  };
}
