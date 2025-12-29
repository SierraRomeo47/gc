// Currency Utility Service
export interface CurrencyInfo {
  code: 'EUR' | 'USD' | 'GBP';
  name: string;
  symbol: string;
  description: string;
}

export const CURRENCY_INFO: Record<string, CurrencyInfo> = {
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    description: 'European Union currency'
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    description: 'United States currency'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    description: 'United Kingdom currency'
  }
};

export class CurrencyService {
  /**
   * Format a number as currency
   */
  static formatCurrency(amount: number, currency: 'EUR' | 'USD' | 'GBP', locale: string = 'en-US'): string {
    const currencyInfo = CURRENCY_INFO[currency];
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `${currencyInfo.symbol}${amount.toFixed(2)}`;
    }
  }

  /**
   * Get currency symbol
   */
  static getCurrencySymbol(currency: 'EUR' | 'USD' | 'GBP'): string {
    return CURRENCY_INFO[currency]?.symbol || currency;
  }

  /**
   * Get currency name
   */
  static getCurrencyName(currency: 'EUR' | 'USD' | 'GBP'): string {
    return CURRENCY_INFO[currency]?.name || currency;
  }

  /**
   * Get currency info
   */
  static getCurrencyInfo(currency: 'EUR' | 'USD' | 'GBP'): CurrencyInfo {
    return CURRENCY_INFO[currency];
  }

  /**
   * Convert amount between currencies (simplified - in real app, use live rates)
   */
  static convertCurrency(
    amount: number, 
    fromCurrency: 'EUR' | 'USD' | 'GBP', 
    toCurrency: 'EUR' | 'USD' | 'GBP'
  ): number {
    // Simplified conversion rates (in real app, use live exchange rates)
    const rates: Record<string, Record<string, number>> = {
      EUR: { USD: 1.08, GBP: 0.85, EUR: 1 },
      USD: { EUR: 0.93, GBP: 0.79, USD: 1 },
      GBP: { EUR: 1.18, USD: 1.27, GBP: 1 }
    };

    return amount * (rates[fromCurrency]?.[toCurrency] || 1);
  }

  /**
   * Get all available currencies
   */
  static getAllCurrencies(): CurrencyInfo[] {
    return Object.values(CURRENCY_INFO);
  }

  /**
   * Search currencies by term
   */
  static searchCurrencies(searchTerm: string): CurrencyInfo[] {
    if (!searchTerm) return this.getAllCurrencies();
    
    const term = searchTerm.toLowerCase();
    return this.getAllCurrencies().filter(currency => 
      currency.code.toLowerCase().includes(term) ||
      currency.name.toLowerCase().includes(term) ||
      currency.description.toLowerCase().includes(term)
    );
  }
}



