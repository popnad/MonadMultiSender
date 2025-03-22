import { useEffect, useState } from 'react';
import { Transaction } from '@/types';
import { getTransactionHistory, clearTransactionHistory } from '@/lib/storage';
import { Button } from "@/components/ui/button";

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // Load transaction history from local storage
    const history = getTransactionHistory();
    setTransactions(history);
    
    // Set up event listener for storage changes
    const handleStorageChange = () => {
      const updatedHistory = getTransactionHistory();
      setTransactions(updatedHistory);
    };
    
    window.addEventListener('storage:transactions', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage:transactions', handleStorageChange);
    };
  }, []);
  
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to seconds
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Limit displayed transactions unless expanded
  const displayedTransactions = isExpanded 
    ? transactions 
    : transactions.slice(0, 3);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 glass-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold gradient-text">Transaction History</h2>
        {transactions.length > 0 && (
          <Button
            onClick={clearTransactionHistory}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            <i className="fas fa-trash-alt mr-1"></i> Clear
          </Button>
        )}
      </div>
      
      {transactions.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <i className="fas fa-history text-primary/70 text-xl"></i>
          </div>
          <p className="text-gray-600 font-medium">No transactions yet</p>
          <p className="text-xs text-gray-500 mt-1">Your transaction history will appear here</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayedTransactions.map((tx) => (
              <div key={tx.txHash} className="transaction-item p-3 rounded-lg glass-card hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-full ${
                      tx.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                    } flex items-center justify-center mr-3`}>
                      <i className={`${
                        tx.status === 'success' ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500'
                      } text-sm`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.status === 'success' ? 'Sent to ' : 'Failed to send to '}
                        <span className="font-bold">{tx.recipientCount}</span> recipient{tx.recipientCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500" title={formatDate(tx.timestamp)}>
                        {formatTimeAgo(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tx.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-2 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Token:</span>
                      <a 
                        href={`https://testnet.monadexplorer.com/token/${tx.tokenAddress}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-mono hover:text-primary transition-colors"
                      >
                        {tx.tokenAddress.slice(0, 6)}...{tx.tokenAddress.slice(-4)}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-gray-500">Contract:</span>
                      <a 
                        href={`https://testnet.monadexplorer.com/address/${tx.contractAddress}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-mono hover:text-primary transition-colors"
                      >
                        {tx.contractAddress.slice(0, 6)}...{tx.contractAddress.slice(-4)}
                      </a>
                    </div>
                  </div>
                  
                  {tx.txHash && (
                    <div className="text-right">
                      <a 
                        href={`https://testnet.monadexplorer.com/tx/${tx.txHash}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center glow-effect"
                      >
                        View on Explorer <i className="fas fa-external-link-alt ml-1"></i>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {transactions.length > 3 && (
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="w-full mt-4 text-xs text-gray-600 hover:text-primary"
            >
              {isExpanded ? (
                <>Show Less <i className="fas fa-chevron-up ml-1"></i></>
              ) : (
                <>Show More ({transactions.length - 3} more) <i className="fas fa-chevron-down ml-1"></i></>
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
