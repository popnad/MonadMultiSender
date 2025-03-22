import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  getAccount, 
  isWalletConnected, 
  approveTokens, 
  multisendTokens,
  switchToMonadTestnet,
  getTokenDecimals,
  getProviderAndSigner
} from "@/lib/web3";
import { addTransaction } from "@/lib/storage";
import { TransactionStatus } from "@/types";
import { ethers } from "ethers";
import { TokenSelector } from "./TokenSelector";
import { FileUploader } from "./FileUploader";
import { DistributionPreview } from "./DistributionPreview";
import { AssetSelector } from "./AssetSelector";
import { MULTISENDER_CONTRACT_ADDRESS, ERC20_ABI } from "@/lib/constants";

// Define Token interface
interface Token {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
}

export function MultisenderForm() {
  const { toast } = useToast();
  const [selectedToken, setSelectedToken] = useState<{
    address: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
  } | null>(null);
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [useCustomToken, setUseCustomToken] = useState(false);
  const [amount, setAmount] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const checkWalletConnection = async () => {
      const connected = await isWalletConnected();
      setWalletConnected(connected);
    };

    checkWalletConnection();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers with up to 18 decimal places
    if (/^\d*\.?\d{0,18}$/.test(value) || value === '') {
      setAmount(value);
    }
  };

  const handleCustomTokenAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomTokenAddress(value);
  };

  const handleCustomTokenFound = async (token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  }) => {
    try {
      const account = await getAccount();
      if (!account) {
        throw new Error("No connected account");
      }

      const { provider } = await getProviderAndSigner();
      if (!provider) {
        throw new Error("No provider available");
      }

      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
      const rawBalance = await tokenContract.balanceOf(account);
      const balance = ethers.utils.formatUnits(rawBalance, token.decimals);
      
      const tokenWithBalance = {
        ...token,
        balance: ethers.utils.formatUnits(rawBalance, token.decimals)
      };
      
      setSelectedToken(tokenWithBalance);
      setUseCustomToken(true);
      
      toast({
        title: "Token detected",
        description: `Found ${token.name} (${token.symbol}) - Balance: ${balance}`,
      });
    } catch (error) {
      console.error("Error handling custom token:", error);
      toast({
        title: "Error detecting token",
        description: error instanceof Error ? error.message : "Failed to get token details",
        variant: "destructive"
      });
    }
  };

  const handleSelectToken = (token: {
    address: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
  }) => {
    setSelectedToken(token);
    setUseCustomToken(false);
    setCustomTokenAddress("");
  };

  const handleAddresses = (addresses: string[]) => {
    setRecipients(addresses);
  };

  const handleSendTokens = async () => {
    if (!walletConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to perform this action",
        variant: "destructive"
      });
      return;
    }

    if (!selectedToken) {
      toast({
        title: "No token selected",
        description: "Please select a token to send",
        variant: "destructive"
      });
      return;
    }

    if (recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one recipient address",
        variant: "destructive"
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    setShowPreview(true);
  };

  const handleConfirmSend = async () => {
    try {
      setIsSubmitting(true);
      setShowPreview(false);

      setTxStatus({
        status: 'processing',
        message: 'Preparing transaction...',
        details: 'Validating recipients and amounts'
      });

      if (recipients.length === 0) {
        throw new Error("No recipients provided");
      }

      // Get current account
      const account = await getAccount();
      if (!account) {
        throw new Error("No account found");
      }

      // All recipients receive the same amount
      const amounts = Array(recipients.length).fill(amount);

      // Approve tokens
      setTxStatus({
        status: 'approving',
        message: 'Approving token spending...',
        details: 'Please confirm the transaction in your wallet'
      });

      await approveTokens(
        selectedToken!.address,
        MULTISENDER_CONTRACT_ADDRESS,
        recipients,
        amounts
      );

      // Execute multisend
      setTxStatus({
        status: 'sending',
        message: 'Sending tokens to recipients...',
        details: 'Please confirm the transaction in your wallet'
      });

      const txHash = await multisendTokens(
        selectedToken!.address,
        MULTISENDER_CONTRACT_ADDRESS,
        recipients,
        amounts
      );

      setTxStatus({
        status: 'success',
        message: 'Transaction successful!',
        details: 'Tokens have been sent to all recipients',
        txHash
      });

      // Add transaction to history
      addTransaction({
        txHash,
        tokenAddress: selectedToken!.address,
        contractAddress: MULTISENDER_CONTRACT_ADDRESS,
        recipientCount: recipients.length,
        status: 'success',
        timestamp: Date.now()
      });

      toast({
        title: "Success",
        description: `Sent tokens to ${recipients.length} recipients`,
      });

      // Reset form after successful transaction
      setTimeout(() => {
        setTxStatus(null);
      }, 5000);
    } catch (error) {
      console.error("Transaction error:", error);
      setTxStatus({
        status: 'error',
        message: 'Transaction failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 glass-card">
      <div className="space-y-6">
        {/* Token Selection Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold gradient-text">Select Token</h2>
          
          <div className="space-y-4">
            <TokenSelector 
              onSelect={handleSelectToken} 
              selectedToken={selectedToken} 
            />
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount per Recipient
              </label>
              <div className="flex items-center gap-3">
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.0"
                  value={amount}
                  onChange={handleAmountChange}
                  className="glass-input"
                />
                {selectedToken && (
                  <div className="text-sm font-medium">
                    {selectedToken.symbol}
                  </div>
                )}
              </div>
              {selectedToken && (
                <p className="mt-1 text-xs text-gray-500">
                  Balance: {selectedToken.balance} {selectedToken.symbol}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Recipients Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold gradient-text">Recipients</h2>
            
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-md glass-card">
                {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <FileUploader onAddresses={handleAddresses} />
        </div>
        
        {/* Submit Section */}
        <div className="flex flex-col gap-3">
          <div className="border-t border-gray-200 pt-4">
            <Button
              onClick={handleSendTokens}
              className="w-full inline-flex justify-center items-center py-3 gradient-button"
              disabled={!walletConnected || isSubmitting || recipients.length === 0 || !selectedToken || !amount}
            >
              {isSubmitting ? (
                <i className="fas fa-circle-notch fa-spin mr-2"></i>
              ) : (
                <i className="fas fa-paper-plane mr-2"></i>
              )}
              Review Distribution
            </Button>
          </div>

          {txStatus && (
            <div className="rounded-md p-3 text-sm glass-card">
              <div className="flex items-start gap-3">
                <div className={`${
                  txStatus.status === 'success' ? 'text-green-500' :
                  txStatus.status === 'error' ? 'text-red-500' :
                  'text-primary'
                }`}>
                  {txStatus.status === 'success' ? (
                    <i className="fas fa-check-circle"></i>
                  ) : txStatus.status === 'error' ? (
                    <i className="fas fa-exclamation-circle"></i>
                  ) : (
                    <i className="fas fa-circle-notch fa-spin"></i>
                  )}
                </div>
                <div>
                  <p className="font-medium">{txStatus.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{txStatus.details}</p>
                  {txStatus.txHash && (
                    <a 
                      href={`https://testnet.monadexplorer.com/tx/${txStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-foreground mt-1 inline-block"
                    >
                      View on Explorer <i className="fas fa-external-link-alt ml-1"></i>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Distribution Preview Dialog */}
      <DistributionPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmSend}
        token={selectedToken}
        recipients={recipients}
        amount={amount}
        contractAddress={MULTISENDER_CONTRACT_ADDRESS}
      />
    </div>
  );
}
