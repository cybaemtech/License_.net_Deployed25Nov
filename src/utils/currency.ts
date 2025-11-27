// Currency exchange rate utility with real-time fetching

export interface ExchangeRates {
  INR: number;
  USD: number;
  AED: number;
  base: string;
  date: string;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }
];

// Cache for exchange rates to avoid hitting API too frequently
let exchangeRatesCache: {
  rates: ExchangeRates | null;
  timestamp: number;
} = {
  rates: null,
  timestamp: 0
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Invalidate the exchange rates cache to force fresh API call
 */
export const invalidateExchangeRatesCache = () => {
  exchangeRatesCache = {
    rates: null,
    timestamp: 0
  };
};

/**
 * Fetch real-time exchange rates from multiple APIs with fallback
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Check cache first
  const now = Date.now();
  if (exchangeRatesCache.rates && (now - exchangeRatesCache.timestamp) < CACHE_DURATION) {
    return exchangeRatesCache.rates;
  }

  try {
    // Primary API: ExchangeRate-API.com
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      const rates: ExchangeRates = {
        INR: data.rates.INR,
        USD: 1, // Base currency
        AED: data.rates.AED,
        base: 'USD',
        date: data.date
      };
      
      // Cache the results
      exchangeRatesCache = {
        rates,
        timestamp: now
      };
      
      return rates;
    }
  } catch (error) {
    console.warn('Primary exchange rate API failed:', error);
  }

  try {
    // Fallback API: Fawaz Ahmed's Free Currency API
    const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
    if (response.ok) {
      const data = await response.json();
      const rates: ExchangeRates = {
        INR: data.usd.inr,
        USD: 1, // Base currency
        AED: data.usd.aed,
        base: 'USD',
        date: data.date || new Date().toISOString().split('T')[0]
      };
      
      // Cache the results
      exchangeRatesCache = {
        rates,
        timestamp: now
      };
      
      return rates;
    }
  } catch (error) {
    console.warn('Fallback exchange rate API failed:', error);
  }

  // If both APIs fail, use default rates (you should update these periodically)
  const fallbackRates: ExchangeRates = {
    INR: 83.50, // Default USD to INR rate
    USD: 1,
    AED: 3.67, // Default USD to AED rate
    base: 'USD',
    date: new Date().toISOString().split('T')[0]
  };

  console.warn('Using fallback exchange rates');
  return fallbackRates;
}

/**
 * Convert amount from one currency to another using real-time rates
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await fetchExchangeRates();
  
  // Convert to USD first if needed
  let usdAmount = amount;
  if (fromCurrency !== 'USD') {
    const fromRate = rates[fromCurrency as keyof ExchangeRates];
    if (typeof fromRate === 'number') {
      usdAmount = amount / fromRate;
    }
  }
  
  // Convert from USD to target currency
  if (toCurrency === 'USD') {
    return usdAmount;
  }
  
  const toRate = rates[toCurrency as keyof ExchangeRates];
  if (typeof toRate === 'number') {
    return usdAmount * toRate;
  }
  
  return usdAmount;
}


export async function calculateTotalCostInINR(
  costPerUser: number,
  quantity: number,
  currency: string
): Promise<number> {
  const totalCost = costPerUser * quantity;
  
  if (currency === 'INR') {
    return totalCost;
  }
  
  return await convertCurrency(totalCost, currency, 'INR');
}

export function formatCurrency(amount: number | string, currency: string): string {
  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid numbers
  if (isNaN(numericAmount)) {
    return '0.00';
  }
  
  // Special formatting for INR (Indian number system)
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  }
  // Try to format with Intl.NumberFormat for any valid currency code
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    // If currency code is invalid, fall back to manual formatting with symbol
    const currencyOption = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    const symbol = currencyOption?.symbol || currency;
    return `${symbol} ${numericAmount.toFixed(2)}`;
  }
}

/**
 * Get current exchange rate for display purposes
 */
export async function getCurrentExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  const rates = await fetchExchangeRates();
  
  if (fromCurrency === 'USD') {
    const rate = rates[toCurrency as keyof ExchangeRates];
    return typeof rate === 'number' ? rate : 1;
  }
  
  if (toCurrency === 'USD') {
    const rate = rates[fromCurrency as keyof ExchangeRates];
    return typeof rate === 'number' ? 1 / rate : 1;
  }
  
  // Convert through USD
  const fromRate = rates[fromCurrency as keyof ExchangeRates];
  const toRate = rates[toCurrency as keyof ExchangeRates];
  
  if (typeof fromRate === 'number' && typeof toRate === 'number') {
    const usdRate = 1 / fromRate;
    return usdRate * toRate;
  }
  
  return 1;
}

/**
 * Format dual currency display - INR on top, original currency below
 * Returns JSX-like structure for display
 */
export interface DualCurrencyDisplay {
  inrAmount: number;
  inrFormatted: string;
  originalAmount: number;
  originalFormatted: string;
  originalCurrency: string;
  showOriginal: boolean;
}

export async function formatDualCurrency(
  amount: number,
  originalCurrency: string
): Promise<DualCurrencyDisplay> {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return {
      inrAmount: 0,
      inrFormatted: '₹0',
      originalAmount: 0,
      originalFormatted: '0.00',
      originalCurrency: 'INR',
      showOriginal: false
    };
  }

  // If already in INR, just return single value
  if (originalCurrency === 'INR') {
    return {
      inrAmount: numericAmount,
      inrFormatted: formatCurrency(numericAmount, 'INR'),
      originalAmount: numericAmount,
      originalFormatted: formatCurrency(numericAmount, 'INR'),
      originalCurrency: 'INR',
      showOriginal: false
    };
  }

  // Convert to INR
  const inrAmount = await convertCurrency(numericAmount, originalCurrency, 'INR');

  return {
    inrAmount,
    inrFormatted: formatCurrency(inrAmount, 'INR'),
    originalAmount: numericAmount,
    originalFormatted: formatCurrency(numericAmount, originalCurrency),
    originalCurrency,
    showOriginal: true
  };
}