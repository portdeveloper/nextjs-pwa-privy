"use client";

import { useState, useCallback, useMemo } from "react";
import { useCreateWallet, useLogin, usePrivy, useSendTransaction, WalletWithMetadata } from "@privy-io/react-auth";

export default function UseLoginPrivy() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { ready, user, logout } = usePrivy();

  const { createWallet: createEthereumWallet } = useCreateWallet();

  const { sendTransaction } = useSendTransaction();

  const ethereumEmbeddedWallets = useMemo<WalletWithMetadata[]>(
    () =>
      (user?.linkedAccounts.filter(
        (account) =>
          account.type === "wallet" &&
          account.walletClientType === "privy" &&
          account.chainType === "ethereum"
      ) as WalletWithMetadata[]) ?? [],
    [user]
  );

  const hasEthereumWallet = ethereumEmbeddedWallets.length > 0;

  const handleCreateWallet = useCallback(async () => {
    setIsCreating(true);
    try {
      await createEthereumWallet();
    } catch (error) {
      console.error("Error creating wallet:", error);
    } finally {
      setIsCreating(false);
    }
  }, [createEthereumWallet]);

  const onSendTransaction = async () => {
    sendTransaction({
      to: userAddress || "",
      value: 100000,
    });
  };

  const { login } = useLogin();

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-2 bg-base-100 p-4 m-8 rounded-lg min-w-96">
      <h2 className="text-lg font-bold">Privy</h2>
      <div className="flex flex-col md:flex-row gap-4">
        <button onClick={() => login()} className="btn btn-xs btn-primary">
          Login
        </button>
        <button onClick={logout} className="btn btn-xs btn-primary">
          Logout
        </button>
        <button 
          onClick={handleCreateWallet} 
          disabled={isCreating || hasEthereumWallet}
          className="btn btn-xs btn-primary disabled:bg-primary/50 disabled:cursor-not-allowed"
        >
          {hasEthereumWallet ? "Wallet Exists" : isCreating ? "Creating..." : "Create Wallet"}
        </button>
      </div>
      {user && (
        <div className="flex flex-col gap-2 w-full ">
          <input
            value={userAddress || ""}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="Enter your address"
          />
          <button
            onClick={onSendTransaction}
            className="btn btn-xs btn-primary self-center"
          >
            Send some MON
          </button>
        </div>
      )}
      {user && (
        <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
          {JSON.stringify(user, null, 2)}
        </pre>
      )}
    </div>
  );
}
