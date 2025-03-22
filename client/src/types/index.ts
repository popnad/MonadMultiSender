// Transaction status for UI feedback
export type TransactionStatusType = 'processing' | 'approving' | 'sending' | 'success' | 'error';

// Transaction status object
export interface TransactionStatus {
  status: TransactionStatusType;
  message: string;
  details: string;
  txHash?: string;
}

// Transaction history item
export interface Transaction {
  txHash: string;
  tokenAddress: string;
  contractAddress: string;
  recipientCount: number;
  status: 'success' | 'error';
  timestamp: number;
}
