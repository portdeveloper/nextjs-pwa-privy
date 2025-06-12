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
    <div>
      <div>
        {/* Header Section */}
        <div>
          <h1>Privy Wallet</h1>
          <p>Connect and manage your embedded wallet</p>
        </div>

        {/* Action Buttons Section */}
        <div>
          <div>
            <button onClick={() => login()}>
              Login
            </button>
            <button onClick={logout}>
              Logout
            </button>
            <button 
              onClick={handleCreateWallet} 
              disabled={isCreating || hasEthereumWallet}
            >
              {hasEthereumWallet ? "✓ Wallet Exists" : isCreating ? "Creating..." : "Create Wallet"}
            </button>
          </div>

          {/* Wallet Information Section */}
          {hasEthereumWallet && (
            <div>
              <h3>Embedded Wallet</h3>
              
              <div>
                <div>
                  <label>Address</label>
                  <div>
                    {walletAddress}
                  </div>
                </div>
                
                <div>
                  <div>
                    <label>Balance</label>
                    <button
                      onClick={fetchBalance}
                      disabled={balanceLoading}
                      title="Refresh balance"
                    >
                      {balanceLoading ? "⟳" : "↻"}
                    </button>
                  </div>
                  <div>
                    <span>
                      {balanceLoading ? (
                        "Loading..."
                      ) : balanceError ? (
                        "Error loading balance"
                      ) : (
                        `${parseFloat(balance || "0").toFixed(4)} MON`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Section */}
          {user && (
            <div>
              <h3>Send Transaction</h3>
              
              <div>
                <div>
                  <label>
                    Recipient Address
                  </label>
                  <input
                    value={userAddress || ""}
                    onChange={(e) => setUserAddress(e.target.value)}
                    placeholder="Enter recipient address"
                  />
                </div>
                
                <button
                  onClick={onSendTransaction}
                  disabled={!userAddress}
                >
                  Send 0.001 MON
                </button>
              </div>
            </div>
          )}

          {/* User Information Section */}
          {user && (
            <div>
              <h3>User Information</h3>
              <div>
                <pre>
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
