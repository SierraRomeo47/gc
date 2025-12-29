import React, { useState, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Euro, PoundSterling } from "lucide-react";
import { CurrencyService } from "@/lib/currencyService";

interface CurrencySelectorProps {
  value: 'EUR' | 'USD' | 'GBP';
  onValueChange: (currency: 'EUR' | 'USD' | 'GBP') => void;
  label?: string;
  className?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  value, 
  onValueChange, 
  label = "Currency",
  className 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCurrencies = useMemo(() => {
    return CurrencyService.searchCurrencies(searchTerm);
  }, [searchTerm]);

  const selectedCurrency = CurrencyService.getCurrencyInfo(value);

  const handleSelect = (currencyCode: string) => {
    onValueChange(currencyCode as 'EUR' | 'USD' | 'GBP');
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={className}>
      <Label htmlFor="currency">{label}</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger>
          <SelectValue>
            {selectedCurrency && (
              <div className="flex items-center gap-2">
                <span>{selectedCurrency.symbol} {selectedCurrency.name} ({selectedCurrency.code})</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {/* Currency Options */}
          {filteredCurrencies.length > 0 ? (
            filteredCurrencies.map((currency) => {
              return (
                <SelectItem 
                  key={currency.code} 
                  value={currency.code}
                  onSelect={() => handleSelect(currency.code)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {currency.symbol} {currency.name} ({currency.code})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {currency.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              );
            })
          ) : (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No currencies found matching "{searchTerm}"
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CurrencySelector;
