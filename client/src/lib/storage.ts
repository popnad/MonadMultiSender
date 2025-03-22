import { Transaction } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Get the Multisender contract address from localStorage
 */
export function getMultisenderContractAddress(): string {
  return localStorage.getItem(STORAGE_KEYS.CONTRACT_ADDRESS) || '';
}

/**
 * Set the Multisender contract address in localStorage
 */
export function setMultisenderContractAddress(address: string): void {
  localStorage.setItem(STORAGE_KEYS.CONTRACT_ADDRESS, address);
  
  // Dispatch event for components to update
  const event = new Event('storage:contract');
  window.dispatchEvent(event);
}

/**
 * Get transaction history from localStorage
 */
export function getTransactionHistory(): Transaction[] {
  const historyJson = localStorage.getItem(STORAGE_KEYS.TRANSACTION_HISTORY);
  if (!historyJson) return [];
  
  try {
    return JSON.parse(historyJson);
  } catch (error) {
    console.error("Error parsing transaction history:", error);
    return [];
  }
}

/**
 * Add a transaction to history
 */
export function addTransaction(transaction: Transaction): void {
  const history = getTransactionHistory();
  const updatedHistory = [transaction, ...history].slice(0, 10); // Keep only last 10 transactions
  
  localStorage.setItem(STORAGE_KEYS.TRANSACTION_HISTORY, JSON.stringify(updatedHistory));
  
  // Dispatch event for components to update
  const event = new Event('storage:transactions');
  window.dispatchEvent(event);
}

/**
 * Clear transaction history
 */
export function clearTransactionHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.TRANSACTION_HISTORY);
  
  // Dispatch event for components to update
  const event = new Event('storage:transactions');
  window.dispatchEvent(event);
}
