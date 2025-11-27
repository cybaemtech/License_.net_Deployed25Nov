import { useEffect, useState } from 'react';
import { formatDualCurrency, DualCurrencyDisplay as DualCurrencyData } from '../utils/currency';

interface DualCurrencyDisplayProps {
  amount: number;
  currency: string;
  className?: string;
}

export default function DualCurrencyDisplay({ 
  amount, 
  currency, 
  className = ''
}: DualCurrencyDisplayProps) {
  const [currencyData, setCurrencyData] = useState<DualCurrencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrency = async () => {
      setLoading(true);
      const data = await formatDualCurrency(amount, currency);
      setCurrencyData(data);
      setLoading(false);
    };

    loadCurrency();
  }, [amount, currency]);

  if (loading || !currencyData) {
    return <div className={className}>Loading...</div>;
  }

  return (
    <div className={className}>
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {currencyData.inrFormatted}
      </div>
      {currencyData.showOriginal && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currencyData.originalFormatted}
        </div>
      )}
    </div>
  );
}
