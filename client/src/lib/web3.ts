import * as ethers from "ethers";
import { MONAD_TESTNET, MULTISENDER_ABI, ERC20_ABI } from "@/lib/constants";
import { addTransaction } from "@/lib/storage";

// Typescript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * Check if MetaMask is installed and accessible
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window.ethereum !== 'undefined';
}

/**
 * Check if wallet is connected
 */
export async function isWalletConnected(): Promise<boolean> {
  if (!isMetaMaskInstalled()) return false;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch (error) {
    console.error("Error checking if wallet is connected:", error);
    return false;
  }
}

/**
 * Get the current Ethereum account
 */
export async function getAccount(): Promise<string | null> {
  if (!isMetaMaskInstalled()) return null;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch (error) {
    console.error("Error getting account:", error);
    return null;
  }
}

/**
 * Connect to MetaMask wallet
 */
export async function connectWallet(): Promise<string | null> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0] || null;
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    throw error;
  }
}

/**
 * Disconnect from wallet (clears state only, doesn't actually disconnect MetaMask)
 */
export async function disconnectWallet(): Promise<void> {
  // MetaMask doesn't have a "disconnect" method
  // This function is mainly for UI state management
  return;
}

/**
 * Switch to Monad testnet
 */
export async function switchToMonadTestnet(): Promise<void> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }
  
  try {
    // Try to switch to the Monad testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_TESTNET.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: MONAD_TESTNET.chainId,
              chainName: MONAD_TESTNET.chainName,
              nativeCurrency: MONAD_TESTNET.nativeCurrency,
              rpcUrls: MONAD_TESTNET.rpcUrls,
              blockExplorerUrls: MONAD_TESTNET.blockExplorerUrls
            },
          ],
        });
      } catch (addError) {
        console.error("Error adding Monad testnet:", addError);
        throw addError;
      }
    } else {
      console.error("Error switching to Monad testnet:", switchError);
      throw switchError;
    }
  }
}

/**
 * Get provider and signer
 */
export function getProviderAndSigner() {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
  return { provider, signer };
}

/**
 * Get token decimals
 */
export async function getTokenDecimals(tokenAddress: string): Promise<number> {
  const { provider } = getProviderAndSigner();
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  
  try {
    const decimals = await tokenContract.decimals();
    return decimals;
  } catch (error) {
    console.error("Error getting token decimals:", error);
    return 18; // Default to 18 decimals if not specified
  }
}

/**
 * Approve token spending for multisender contract
 */
export async function approveTokens(
  tokenAddress: string,
  contractAddress: string,
  recipients: string[],
  amounts: string[]
): Promise<void> {
  if (!isWalletConnected()) {
    throw new Error("Wallet not connected");
  }
  
  // Make sure we're on the Monad testnet
  await switchToMonadTestnet();
  
  const { signer } = getProviderAndSigner();
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  
  try {
    // Get token decimals
    const decimals = await getTokenDecimals(tokenAddress);
    console.log(`Token decimals: ${decimals}`);
    
    // Calculate total amount
    let totalAmount = ethers.BigNumber.from(0);
    for (const amount of amounts) {
      const amountInWei = ethers.utils.parseUnits(amount, decimals);
      totalAmount = totalAmount.add(amountInWei);
    }
    
    console.log(`Approving total amount: ${ethers.utils.formatUnits(totalAmount, decimals)} tokens (${totalAmount.toString()} wei)`);
    
    // Check current allowance
    const account = await getAccount();
    const currentAllowance = await tokenContract.allowance(account, contractAddress);
    console.log(`Current allowance: ${ethers.utils.formatUnits(currentAllowance, decimals)} tokens`);
    
    // Approve spending
    const tx = await tokenContract.approve(contractAddress, totalAmount);
    console.log(`Approval transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Approval transaction confirmed in block ${receipt.blockNumber}`);
  } catch (error) {
    console.error("Error approving tokens:", error);
    throw error;
  }
}

/**
 * Execute multisend transaction
 */
export async function multisendTokens(
  tokenAddress: string,
  contractAddress: string,
  recipients: string[],
  amounts: string[]
): Promise<string> {
  if (!isWalletConnected()) {
    throw new Error("Wallet not connected");
  }
  
  // Make sure we're on the Monad testnet
  await switchToMonadTestnet();
  
  const { signer } = getProviderAndSigner();
  const multisenderContract = new ethers.Contract(contractAddress, MULTISENDER_ABI, signer);
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  
  try {
    // Get token decimals
    const decimals = await getTokenDecimals(tokenAddress);
    console.log(`Token decimals: ${decimals}`);
    
    // Calculate total amount for logging
    let totalAmount = ethers.BigNumber.from(0);
    
    // Convert amounts to wei
    const amountsInWei = amounts.map(amount => {
      const amountInWei = ethers.utils.parseUnits(amount, decimals);
      totalAmount = totalAmount.add(amountInWei);
      return amountInWei;
    });
    
    console.log(`Total amount to send: ${ethers.utils.formatUnits(totalAmount, decimals)} tokens to ${recipients.length} recipients`);
    
    // Check allowance
    const account = await getAccount();
    const currentAllowance = await tokenContract.allowance(account, contractAddress);
    console.log(`Current allowance: ${ethers.utils.formatUnits(currentAllowance, decimals)} tokens`);
    
    if (currentAllowance.lt(totalAmount)) {
      console.warn(`Insufficient allowance. Have ${ethers.utils.formatUnits(currentAllowance, decimals)}, need ${ethers.utils.formatUnits(totalAmount, decimals)}`);
    }
    
    // Execute multisend
    console.log(`Executing multisend for ${recipients.length} recipients...`);
    const tx = await multisenderContract.multisend(tokenAddress, recipients, amountsInWei, {
      gasLimit: 3000000 // Set a higher gas limit for Monad testnet
    });
    console.log(`Multisend transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Multisend transaction confirmed in block ${receipt.blockNumber}`);
    
    // Save transaction to history
    addTransaction({
      txHash: receipt.transactionHash,
      tokenAddress,
      contractAddress,
      recipientCount: recipients.length,
      status: 'success',
      timestamp: Date.now()
    });
    
    return receipt.transactionHash;
  } catch (error) {
    console.error("Error executing multisend:", error);
    
    // Save failed transaction to history
    addTransaction({
      txHash: '',
      tokenAddress,
      contractAddress,
      recipientCount: recipients.length,
      status: 'error',
      timestamp: Date.now()
    });
    
    throw error;
  }
}
