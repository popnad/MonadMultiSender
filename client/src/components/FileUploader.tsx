import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";

interface FileUploaderProps {
  onAddresses: (addresses: string[]) => void;
}

export function FileUploader({ onAddresses }: FileUploaderProps) {
  const [fileDetails, setFileDetails] = useState<{
    name: string; 
    count: number;
    skippedCount: number;
  } | null>(null);
  const [previewAddresses, setPreviewAddresses] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setWarning(null);
      const addresses = await parseFile(file);
      
      // Validate addresses
      const validAddresses: string[] = [];
      const invalidAddresses: string[] = [];
      
      for (const address of addresses) {
        if (ethers.utils.isAddress(address)) {
          validAddresses.push(address);
        } else if (address.trim()) {
          invalidAddresses.push(address);
        }
      }
      
      if (validAddresses.length === 0) {
        setError("No valid Ethereum addresses found in the file. Please check your file format.");
        return;
      }
      
      if (invalidAddresses.length > 0) {
        setWarning(`Skipped ${invalidAddresses.length} invalid addresses. Only valid addresses will be used.`);
      }
      
      setFileDetails({
        name: file.name,
        count: validAddresses.length,
        skippedCount: invalidAddresses.length
      });
      
      setPreviewAddresses(validAddresses.slice(0, 5));
      onAddresses(validAddresses);
    } catch (error) {
      console.error("Error parsing file:", error);
      setError("Failed to parse file. Make sure it's a valid CSV or TXT file.");
    }
  };

  const parseFile = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // Process based on file extension
          const extension = file.name.split('.').pop()?.toLowerCase();
          let addresses: string[] = [];
          
          if (extension === 'csv') {
            // Parse CSV
            const lines = content.split(/\r?\n/).filter(line => line.trim());
            addresses = lines.map(line => {
              // Extract first column if there are multiple
              const columns = line.split(',');
              return columns[0]?.trim();
            }).filter(Boolean);
          } else if (extension === 'txt') {
            // Parse TXT (one address per line)
            addresses = content.split(/\r?\n/)
              .map(line => line.trim())
              .filter(Boolean);
          } else {
            reject(new Error("Unsupported file format. Please use CSV or TXT."));
            return;
          }
          
          resolve(addresses);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };
      
      reader.readAsText(file);
    });
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileDetails(null);
    setPreviewAddresses([]);
    setWarning(null);
    setError(null);
    onAddresses([]);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-primary/5 cursor-pointer transition-all duration-300 glass-card glow-effect"
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.txt"
          className="hidden"
        />
        <div className="text-primary">
          <i className="fas fa-file-upload text-3xl mb-2"></i>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Click to upload CSV or TXT file
        </p>
        <p className="text-xs text-gray-500">
          One address per line or first column of CSV
        </p>
      </div>
      
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
          <i className="fas fa-exclamation-triangle mr-1"></i> {error}
        </div>
      )}
      
      {warning && (
        <div className="text-amber-600 text-sm p-2 bg-amber-50 rounded-md">
          <i className="fas fa-exclamation-circle mr-1"></i> {warning}
        </div>
      )}
      
      {fileDetails && (
        <div className="bg-gray-50 rounded-lg p-3 glass-card">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-sm font-medium">
                <i className="fas fa-file-alt mr-1 text-primary"></i> {fileDetails.name}
              </p>
              <p className="text-xs text-gray-500">
                {fileDetails.count} valid addresses loaded
                {fileDetails.skippedCount > 0 && ` (${fileDetails.skippedCount} invalid skipped)`}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFile}
              className="text-gray-500 hover:text-red-500"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
          
          {previewAddresses.length > 0 && (
            <div className="mt-2 border-t border-gray-200 pt-2">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <div className="max-h-[100px] overflow-y-auto">
                {previewAddresses.map((address, index) => (
                  <div key={index} className="text-xs font-mono text-gray-700 truncate hover:text-primary">
                    {address}
                  </div>
                ))}
                {fileDetails.count > previewAddresses.length && (
                  <div className="text-xs text-gray-500 mt-1">
                    + {fileDetails.count - previewAddresses.length} more addresses
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}