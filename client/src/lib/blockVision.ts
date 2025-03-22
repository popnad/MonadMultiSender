import { ethers } from "ethers";

// BlockVision API key
const BLOCKVISION_API_KEY = "2uPncYpwIksXquuB9jB6pG6UqhP";

// Base URL for the BlockVision API
const BLOCKVISION_API_BASE_URL = "https://api.testnet.monadexplorer.com";

// Interface for token balance response
interface TokenBalanceResponse {
  balances: Array<{
    contractAddress: string;
    tokenBalance: string;
    name: string;
    symbol: string;
    decimals: number;
  }>;
}

// Interface for token details response
interface TokenDetailsResponse {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

/**
 * Get token balances for a wallet address
 */
export async function getTokenBalances(walletAddress: string): Promise<Array<{
  address: string;
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
}>> {
  try {
    const response = await fetch(
      `${BLOCKVISION_API_BASE_URL}/token/balances/${walletAddress}?key=${BLOCKVISION_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`BlockVision API request failed with status ${response.status}`);
    }
    
    const data: TokenBalanceResponse = await response.json();
    
    // Add MON (native token) with 0 balance as default
    const tokens = [
      {
        address: "0x0000000000000000000000000000000000000000", // Native token
        name: "Monad",
        symbol: "MON",
        balance: "0",
        decimals: 18
      }
    ];

    // Add token balances from the API response
    if (data.balances) {
      data.balances.forEach(token => {
        tokens.push({
          address: token.contractAddress,
          name: token.name,
          symbol: token.symbol,
          balance: ethers.utils.formatUnits(token.tokenBalance, token.decimals),
          decimals: token.decimals
        });
      });
    }
    
    return tokens;
  } catch (error) {
    console.error("Error fetching token balances from BlockVision:", error);
    
    // Return at least the native token as fallback
    return [
      {
        address: "0x0000000000000000000000000000000000000000",
        name: "Monad",
        symbol: "MON",
        balance: "0",
        decimals: 18
      }
    ];
  }
}

/**
 * Get details for a specific token contract address
 */
export async function getTokenDetails(tokenAddress: string): Promise<{
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
} | null> {
  try {
    const response = await fetch(
      `${BLOCKVISION_API_BASE_URL}/token/details/${tokenAddress}?key=${BLOCKVISION_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`BlockVision API request failed with status ${response.status}`);
    }
    
    const data: TokenDetailsResponse = await response.json();
    
    return {
      address: data.contractAddress,
      name: data.name,
      symbol: data.symbol,
      decimals: data.decimals,
      totalSupply: data.totalSupply ? ethers.utils.formatUnits(data.totalSupply, data.decimals) : undefined
    };
  } catch (error) {
    console.error("Error fetching token details from BlockVision:", error);
    return null;
  }
}

/**
 * Get token metadata from contract using multiple approaches:
 * 1. BlockVision API
 * 2. Direct contract call via ethers.js if API fails
 */
export async function getTokenMetadata(
  tokenAddress: string, 
  provider: ethers.providers.Provider
): Promise<{
  address: string;
  name: string;
  symbol: string;
  decimals: number;
} | null> {
  try {
    // First attempt: BlockVision API
    const apiData = await getTokenDetails(tokenAddress);
    if (apiData) {
      return {
        address: apiData.address,
        name: apiData.name,
        symbol: apiData.symbol,
        decimals: apiData.decimals
      };
    }
    
    // Second attempt: Direct contract call
    const tokenAbi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)"
    ];
    
    const contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
    
    // Get token details from contract
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals()
    ]);
    
    return {
      address: tokenAddress,
      name,
      symbol,
      decimals
    };
  } catch (error) {
    console.error("Error detecting token metadata:", error);
    return null;
  }
}