import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssetSelector } from "./AssetSelector";

interface Token {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
}

interface TokenSelectorProps {
  onSelect: (token: Token) => void;
  selectedToken?: Token | null;
}

export function TokenSelector({ onSelect, selectedToken }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCustomTokenAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTokenAddress(e.target.value);
    setError(null);
  };

  const handleCustomTokenFound = (token: Token) => {
    onSelect(token);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between token-selector glass-input glow-effect"
        >
          {selectedToken ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                {selectedToken.symbol.charAt(0)}
              </div>
              <span>{selectedToken.symbol}</span>
              <span className="text-xs text-gray-500">({selectedToken.name})</span>
            </div>
          ) : (
            <span>Select Token</span>
          )}
          <i className="fas fa-chevron-down text-xs"></i>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle className="gradient-text">Select Token</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Custom Token Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Custom Token Address"
                value={customTokenAddress}
                onChange={handleCustomTokenAddressChange}
                className="glass-input"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <AssetSelector
              contractAddress={customTokenAddress}
              onTokenFound={handleCustomTokenFound}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}