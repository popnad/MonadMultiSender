import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { 
  connectWallet, 
  disconnectWallet, 
  getAccount, 
  isWalletConnected, 
  switchToMonadTestnet 
} from "@/lib/web3";
import { MONAD_TESTNET } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export function NetworkStatus() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{
    chainId: string | null;
    name: string;
  }>({
    chainId: null,
    name: "Unknown Network"
  });

  // Check network and connection
  const checkNetworkAndConnection = async () => {
    try {
      // Check if MetaMask is connected
      if (await isWalletConnected()) {
        const acc = await getAccount();
        setAccount(acc);
        setConnected(true);
        
        // Check if we're on the right network
        if (window.ethereum) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          // Convert chainId to hex string for comparison
          // The MONAD_TESTNET.chainId is already in hex format
          const expectedChainIdHex = MONAD_TESTNET.chainId;
          
          setNetworkInfo({
            chainId,
            name: chainId === expectedChainIdHex 
              ? "Monad Testnet" 
              : "Unsupported Network"
          });
          
          setIsCorrectNetwork(chainId === expectedChainIdHex);
        }
      } else {
        setConnected(false);
        setAccount(null);
        setIsCorrectNetwork(false);
      }
    } catch (err) {
      console.error("Failed to check wallet connection:", err);
    }
  };

  useEffect(() => {
    checkNetworkAndConnection();

    // Listen for account and network changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
          checkNetworkAndConnection();
        } else {
          setAccount(null);
          setConnected(false);
          setIsCorrectNetwork(false);
        }
      });

      window.ethereum.on('chainChanged', () => {
        checkNetworkAndConnection();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await connectWallet();
      
      // Try to switch to Monad testnet
      await switchToMonadTestnet();
      
      // Update status after connection
      await checkNetworkAndConnection();
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await switchToMonadTestnet();
      await checkNetworkAndConnection();
    } catch (err) {
      console.error("Network switch error:", err);
      setError(err instanceof Error ? err.message : "Failed to switch network");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setAccount(null);
    setConnected(false);
    setIsCorrectNetwork(false);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 glass-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold gradient-text">Network Status</h2>
            {connected && (
              <Badge variant={isCorrectNetwork ? "default" : "destructive"} className="rounded-full">
                {isCorrectNetwork ? "Monad Testnet" : "Wrong Network"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {connected 
              ? isCorrectNetwork 
                ? "Connected to Monad Testnet" 
                : "Please switch to Monad Testnet (Chain ID: 10143)"
              : "Connect your wallet to proceed with token transfers"}
          </p>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {!connected ? (
            <Button 
              onClick={handleConnect} 
              className="inline-flex items-center justify-center gradient-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  Connecting...
                </>
              ) : (
                <>
                  <i className="fas fa-wallet mr-2"></i>
                  Connect Wallet
                </>
              )}
            </Button>
          ) : !isCorrectNetwork ? (
            <Button 
              onClick={handleSwitchNetwork}
              className="inline-flex items-center justify-center gradient-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  Switching...
                </>
              ) : (
                <>
                  <i className="fas fa-exchange-alt mr-2"></i>
                  Switch to Monad Testnet
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="inline-flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <i className="fas fa-sign-out-alt mr-1"></i> Disconnect
            </Button>
          )}
          
          {connected && (
            <div className="flex items-center px-3 py-2 rounded-md glass-card text-sm">
              <span className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <a 
                  href={`https://testnet.monadexplorer.com/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {account ? shortenAddress(account) : 'Connected'}
                </a>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
