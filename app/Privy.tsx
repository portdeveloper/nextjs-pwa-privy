"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useCreateWallet, useLogin, usePrivy, useSendTransaction, WalletWithMetadata } from "@privy-io/react-auth";
import { createPublicClient, http, formatEther } from "viem";
import { monadTestnet } from "viem/chains";

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

export default function UseLoginPrivy() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
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
  const walletAddress = ethereumEmbeddedWallets[0]?.address;

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;
    
    setBalanceLoading(true);
    setBalanceError(false);
    
    try {
      const balanceWei = await publicClient.getBalance({
        address: walletAddress as `0x${string}`,
      });
      const balanceEth = formatEther(balanceWei);
      setBalance(balanceEth);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalanceError(true);
    } finally {
      setBalanceLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress, fetchBalance]);

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
      {hasEthereumWallet && (
        <div className="w-full p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm font-semibold text-gray-700 mb-2">Embedded Wallet:</p>
          <p className="text-xs font-mono bg-white p-2 rounded border break-all mb-2">
            {walletAddress}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Balance:</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono">
                {balanceLoading ? (
                  "Loading..."
                ) : balanceError ? (
                  "Error loading balance"
                ) : (
                  `${parseFloat(balance || "0").toFixed(4)} MON`
                )}
              </p>
              <button
                onClick={fetchBalance}
                className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700"
                disabled={balanceLoading}
              >
                ↻
              </button>
            </div>
          </div>
        </div>
      )}
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
            Send 0.001 MON
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
