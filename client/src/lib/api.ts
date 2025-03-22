import { MONAD_TESTNET } from "./constants";

const BLOCKVISION_API_KEY = "2uPncYpwIksXquuB9jB6pG6UqhP";
const MONAD_EXPLORER_API = "https://testnet-api.monadexplorer.com/api";

interface TokenBalanceResponse {
  result: {
    tokenBalances: Array<{
      contractAddress: string;
      tokenBalance: string;
      name: string;
      symbol: string;
      decimals: number;
    }>;
  };
}

interface TokenDetailsResponse {
  result: {
    contractAddress: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  };
}

/**
 * Get token balances for a wallet address
 */
export async function getTokenBalances(walletAddress: string): Promise<Array<{
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
}>> {
  try {
    const response = await fetch(`${MONAD_EXPLORER_API}/v1/address/${walletAddress}/tokens`, {
      headers: {
        'x-api-key': BLOCKVISION_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching token balances: ${response.statusText}`);
    }

    const data: TokenBalanceResponse = await response.json();
    
    // Add MON (native token) with 0 balance as default
    const tokens = [
      {
        address: "0x0000000000000000000000000000000000000000", // Native token
        symbol: "MON",
        name: "Monad",
        balance: "0",
        decimals: 18
      }
    ];

    // Add the token balances from the API response
    if (data.result?.tokenBalances) {
      data.result.tokenBalances.forEach(token => {
        tokens.push({
          address: token.contractAddress,
          symbol: token.symbol,
          name: token.name,
          balance: token.tokenBalance,
          decimals: token.decimals
        });
      });
    }

    return tokens;
  } catch (error) {
    console.error("Error fetching token balances:", error);
    // Return at least the native token as fallback
    return [
      {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "MON",
        name: "Monad",
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
  symbol: string;
  name: string;
  decimals: number;
} | null> {
  try {
    const response = await fetch(`${MONAD_EXPLORER_API}/v1/token/${tokenAddress}`, {
      headers: {
        'x-api-key': BLOCKVISION_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching token details: ${response.statusText}`);
    }

    const data: TokenDetailsResponse = await response.json();
    
    if (data.result) {
      return {
        address: data.result.contractAddress,
        symbol: data.result.symbol,
        name: data.result.name,
        decimals: data.result.decimals
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching token details:", error);
    return null;
  }
}

/**
 * Get token metadata from contract address using BlockVision API
 * This provides a reliable way to detect tokens from their contract address
 */
export async function getTokenMetadata(tokenAddress: string): Promise<{
  address: string;
  name: string;
  symbol: string;
  decimals: number;
} | null> {
  try {
    // Use the existing getTokenDetails function
    const tokenDetails = await getTokenDetails(tokenAddress);
    
    if (tokenDetails) {
      return {
        address: tokenDetails.address,
        name: tokenDetails.name,
        symbol: tokenDetails.symbol,
        decimals: tokenDetails.decimals
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    return null;
  }
}