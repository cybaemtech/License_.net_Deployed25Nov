import { formatCurrency } from '../utils/currency';

interface SimpleCurrencyDisplayProps {
  inrAmount: number;
  originalAmount?: number;
  originalCurrency?: string;
  preferredCurrency?: string;
  className?: string;
}

export default function SimpleCurrencyDisplay({ 
  inrAmount,
  originalAmount,
  originalCurrency,
  preferredCurrency,
  className = ''
}: SimpleCurrencyDisplayProps) {
  // If preferred currency is set and matches the original currency, show it primarily
  const shouldShowPreferredCurrency = preferredCurrency && originalCurrency && preferredCurrency === originalCurrency && originalAmount !== undefined;
  
  // If preferred currency is set but different from original, show preferred with INR conversion
  const shouldShowINRSecondary = preferredCurrency && preferredCurrency !== 'INR' && !shouldShowPreferredCurrency;
  
  // Default behavior: show original currency as secondary if different from INR
  const showOriginalAsSecondary = !preferredCurrency && originalCurrency && originalCurrency !== 'INR' && originalAmount !== undefined;

  return (
    <div className={className}>
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {shouldShowPreferredCurrency 
          ? formatCurrency(originalAmount!, originalCurrency!)
          : formatCurrency(inrAmount, 'INR')}
      </div>
      {(showOriginalAsSecondary || shouldShowINRSecondary) && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {showOriginalAsSecondary 
            ? formatCurrency(originalAmount!, originalCurrency!)
            : shouldShowINRSecondary 
              ? formatCurrency(inrAmount, 'INR')
              : null}
        </div>
      )}
    </div>
  );
}
