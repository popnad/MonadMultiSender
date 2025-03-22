import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getProviderAndSigner } from '@/lib/web3';
import { ERC20_ABI } from '@/lib/constants';
import { getTokenMetadata } from '@/lib/blockVision';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AssetSelectorProps {
  contractAddress: string;
  onTokenFound: (token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  }) => void;
}

export function AssetSelector({ contractAddress, onTokenFound }: AssetSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    decimals: number;
  } | null>(null);

  useEffect(() => {
    // Reset state when contract address changes
    setTokenInfo(null);
    setError(null);
    
    if (!contractAddress || !ethers.utils.isAddress(contractAddress)) {
      return;
    }

    const fetchTokenInfo = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { provider } = getProviderAndSigner();
        
        if (!provider) {
          throw new Error("No provider available");
        }
        
        // Try fetching from BlockVision API or direct contract call
        const tokenMetadata = await getTokenMetadata(contractAddress, provider);
        
        if (tokenMetadata) {
          setTokenInfo({
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            decimals: tokenMetadata.decimals,
          });
          
          onTokenFound({
            address: contractAddress,
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            decimals: tokenMetadata.decimals,
          });
          
          return;
        } else {
          // If we couldn't get metadata through either method, try direct contract call
          const tokenContract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
          
          // Call contract methods directly
          const [name, symbol, decimals] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.decimals(),
          ]);
          
          setTokenInfo({
            name,
            symbol,
            decimals,
          });
          
          onTokenFound({
            address: contractAddress,
            name,
            symbol,
            decimals,
          });
        }
      } catch (error) {
        console.error("Failed to fetch token info:", error);
        setError("Invalid ERC-20 token address or contract not accessible");
      } finally {
        setIsLoading(false);
      }
    };

    if (ethers.utils.isAddress(contractAddress)) {
      fetchTokenInfo();
    }
  }, [contractAddress, onTokenFound]);

  if (!ethers.utils.isAddress(contractAddress)) {
    return null;
  }

  return (
    <div className="mt-2">
      {isLoading ? (
        <Card className="p-3 glass-card">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </Card>
      ) : error ? (
        <div className="text-red-500 text-sm my-2">{error}</div>
      ) : tokenInfo ? (
        <Card className="p-3 glass-card hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {tokenInfo.symbol.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{tokenInfo.name}</div>
              <div className="text-xs text-gray-500">
                Symbol: {tokenInfo.symbol} • Decimals: {tokenInfo.decimals}
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}