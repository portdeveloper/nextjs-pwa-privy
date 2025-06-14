"use client";

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { monadTestnet } from "viem/chains";


export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BasePrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
        config={{
          // Create embedded wallets for users who don't have a wallet
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
            priceDisplay: {
              primary: "native-token",
              secondary: null,
            },
          },
          defaultChain: monadTestnet,
          supportedChains: [monadTestnet],
        }}
      >
        {children}
      </BasePrivyProvider>
    </div>
  );
}
