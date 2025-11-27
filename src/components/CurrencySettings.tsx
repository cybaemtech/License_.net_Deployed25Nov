import { useState, useEffect } from 'react';
import { DollarSign, Plus, Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchApi } from '../utils/apiHelper';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_inr: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

function CurrencySettings() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    symbol: '',
    exchange_rate_to_inr: '1.0',
    is_default: false
  });

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const result = await fetchApi('/currencies', {
        method: 'GET',
      });
      
      if (result.success) {
        setCurrencies(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch currencies');
      }
    } catch (err) {
      console.error('Error fetching currencies:', err);
      setMessage({ type: 'error', text: 'Failed to load currencies' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      
      const result = await fetchApi('/currencies', {
        method: 'POST',
        body: JSON.stringify({
          code: newCurrency.code.toUpperCase(),
          name: newCurrency.name,
          symbol: newCurrency.symbol,
          exchange_rate_to_inr: parseFloat(newCurrency.exchange_rate_to_inr),
          is_default: newCurrency.is_default
        }),
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Currency added successfully!' });
        setNewCurrency({
          code: '',
          name: '',
          symbol: '',
          exchange_rate_to_inr: '1.0',
          is_default: false
        });
        setShowAddForm(false);
        
        // Refresh the currencies list
        await fetchCurrencies();
      } else {
        throw new Error(result.error || 'Failed to add currency');
      }
    } catch (err) {
      console.error('Error adding currency:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add currency' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRate = async (id: string, newRate: string) => {
    const parsedRate = parseFloat(newRate);
    
    if (!newRate || isNaN(parsedRate) || parsedRate <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid positive exchange rate' });
      await fetchCurrencies();
      return;
    }

    try {
      const result = await fetchApi('/currencies', {
        method: 'PUT',
        body: JSON.stringify({
          id: id,
          exchange_rate_to_inr: parsedRate
        }),
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Exchange rate updated successfully!' });
        await fetchCurrencies();
      } else {
        throw new Error(result.error || 'Failed to update exchange rate');
      }
    } catch (err) {
      console.error('Error updating exchange rate:', err);
      setMessage({ type: 'error', text: 'Failed to update exchange rate' });
      await fetchCurrencies();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Currency Management</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Currency
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-start ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddCurrency} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Currency</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                value={newCurrency.code}
                onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                placeholder="e.g., USD, EUR, GBP"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCurrency.name}
                onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                placeholder="e.g., US Dollar, Euro"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                value={newCurrency.symbol}
                onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                placeholder="e.g., $, €, £"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exchange Rate to INR <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={newCurrency.exchange_rate_to_inr}
                onChange={(e) => setNewCurrency({ ...newCurrency, exchange_rate_to_inr: e.target.value })}
                placeholder="e.g., 83.0000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewCurrency({
                  code: '',
                  name: '',
                  symbol: '',
                  exchange_rate_to_inr: '1.0',
                  is_default: false
                });
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Adding...' : 'Add Currency'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading currencies...</span>
        </div>
      ) : currencies.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No currencies found. Add your first currency above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Code</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Symbol</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Exchange Rate (to INR)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((currency) => (
                <tr key={currency.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900 dark:text-white">{currency.code}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{currency.name}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{currency.symbol}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      defaultValue={currency.exchange_rate_to_inr}
                      onBlur={(e) => {
                        const newRate = e.target.value;
                        if (newRate !== currency.exchange_rate_to_inr) {
                          handleUpdateRate(currency.id, newRate);
                        }
                      }}
                      className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </td>
                  <td className="py-3 px-4">
                    {currency.is_default ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Default
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CurrencySettings;
