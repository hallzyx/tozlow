import { http, createConfig } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";
const rpcUrl =
  process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC ??
  "https://sepolia-rollup.arbitrum.io/rpc";

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors: [
    injected(),
    ...(wcProjectId
      ? [walletConnect({ projectId: wcProjectId })]
      : []),
  ],
  transports: {
    [arbitrumSepolia.id]: http(rpcUrl),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
