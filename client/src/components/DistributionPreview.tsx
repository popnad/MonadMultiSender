import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";
import { getAccount } from "@/lib/web3";
import { useIsMobile } from "@/hooks/use-mobile";

interface Token {
  address: string;
  symbol: string;
  name: string;
  balance?: string;
  decimals: number;
}

interface DistributionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  token: Token | null;
  recipients: string[];
  amount: string;
  contractAddress: string;
}

export function DistributionPreview({
  isOpen,
  onClose,
  onConfirm,
  token,
  recipients,
  amount,
  contractAddress
}: DistributionPreviewProps) {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<string>("~0.001");

  // Get current wallet address
  useEffect(() => {
    async function fetchWalletAddress() {
      try {
        const account = await getAccount();
        setWalletAddress(account);
      } catch (error) {
        console.error("Error getting wallet address:", error);
      }
    }
    
    if (isOpen) {
      fetchWalletAddress();
    }
  }, [isOpen]);

  // Calculate total amount to be sent
  const totalAmount = !token || !amount || isNaN(parseFloat(amount)) 
    ? "0" 
    : ethers.utils.formatUnits(
        ethers.utils.parseUnits(amount, token.decimals).mul(recipients.length), 
        token.decimals
      );

  // Check if user has sufficient balance
  useEffect(() => {
    if (token && token.balance && totalAmount) {
      const userBalance = parseFloat(token.balance);
      const requiredAmount = parseFloat(totalAmount);
      setInsufficientBalance(userBalance < requiredAmount);
    }
  }, [token, totalAmount]);

  // Simulate gas estimation based on number of recipients
  useEffect(() => {
    if (recipients.length > 0) {
      // This is a simplified estimation, not actual gas calculation
      const baseGas = 0.001;
      const recipientFactor = 0.00001 * recipients.length;
      const estimatedGas = Math.min(baseGas + recipientFactor, 0.01);
      setGasEstimate(estimatedGas.toFixed(6));
    }
  }, [recipients.length]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const PreviewContent = () => (
    <>
      <div className="space-y-4 my-2">
        {/* Summary */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <div className="text-sm font-medium">Sending to {recipients.length} recipients</div>
            <div className="text-xs text-gray-500">
              {amount} {token?.symbol} per address
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-primary">
              {totalAmount} {token?.symbol}
            </div>
            <div className="text-xs text-gray-500">Total to send</div>
          </div>
        </div>

        {/* Token Info - Compact */}
        {token && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">{token.symbol.charAt(0)}</span>
              </div>
              <div>
                <div className="text-sm font-medium">{token.name}</div>
                <div className="text-xs text-gray-500">{token.symbol}</div>
              </div>
            </div>
            <a 
              href={`https://testnet.monadexplorer.com/token/${token.address}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View Token
            </a>
          </div>
        )}

        {/* Recipient Preview */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Recipients</h3>
            <span className="text-xs bg-primary/10 px-2 py-1 rounded text-primary">
              {recipients.length} total
            </span>
          </div>
          
          <div className="max-h-[160px] overflow-y-auto border border-gray-100 rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Address</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recipients.slice(0, 5).map((address, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500">{index + 1}</td>
                    <td className="py-2 px-3 font-mono truncate max-w-[150px]">
                      <a 
                        href={`https://testnet.monadexplorer.com/address/${address}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        {address}
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {amount} {token?.symbol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recipients.length > 5 && (
              <div className="text-xs text-center py-2 bg-gray-50 text-gray-500 border-t border-gray-100">
                + {recipients.length - 5} more recipients...
              </div>
            )}
          </div>
        </div>

        {/* Transaction Details - Compact */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-sm">
          <div className="text-gray-500">Network:</div>
          <div className="font-medium">Monad Testnet</div>
          
          <div className="text-gray-500">Estimated Gas:</div>
          <div className="font-medium">{gasEstimate} MON</div>
          
          <div className="text-gray-500">Contract:</div>
          <div className="font-mono text-xs truncate">
            <a 
              href={`https://testnet.monadexplorer.com/address/${contractAddress}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
            </a>
          </div>
        </div>
        
        {insufficientBalance && (
          <div className="bg-red-50 text-red-500 p-2 rounded-md text-sm">
            <i className="fas fa-exclamation-circle mr-1"></i>
            Warning: Insufficient balance for this transaction
          </div>
        )}
      </div>
      
      <div className="flex gap-2 justify-between mt-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting || insufficientBalance}
          className="gradient-button"
        >
          {isSubmitting ? (
            <>
              <i className="fas fa-circle-notch fa-spin mr-2"></i> Processing...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane mr-2"></i> Send Tokens
            </>
          )}
        </Button>
      </div>
    </>
  );

  return isMobile ? (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Confirm Distribution</DrawerTitle>
          <DrawerDescription>Review token distribution details</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <PreviewContent />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glass-card">
        <DialogHeader>
          <DialogTitle className="gradient-text">Confirm Distribution</DialogTitle>
          <DialogDescription>
            Review the details of your token distribution
          </DialogDescription>
        </DialogHeader>
        <PreviewContent />
      </DialogContent>
    </Dialog>
  );
}