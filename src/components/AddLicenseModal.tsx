import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Upload, FileText } from 'lucide-react';
import { 
  SUPPORTED_CURRENCIES, 
  calculateTotalCostInINR, 
  getCurrentExchangeRate,
  invalidateExchangeRatesCache 
} from '../utils/currency';
import { getApiBaseUrl } from '../utils/api';

interface AddLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AddLicenseModal({ isOpen, onClose, onSuccess }: AddLicenseModalProps) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [gstTreatment, setGstTreatment] = useState('');
  const [sourceOfSupply, setSourceOfSupply] = useState('');
  const [gst, setGst] = useState('');
  const [toolName, setToolName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [vendor, setVendor] = useState('');
  const [costPerUser, setCostPerUser] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [totalCostINR, setTotalCostINR] = useState<number>(0);
  const [refreshingRates, setRefreshingRates] = useState(false);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billFileName, setBillFileName] = useState<string>('');

  const getCurrentCurrency = () => {
    return SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];
  };

  const calculateTotalCost = () => {
    const cost = parseFloat(costPerUser) || 0;
    const qty = parseInt(quantity) || 0;
    return cost * qty;
  };

  const updateExchangeRate = async () => {
    try {
      if (selectedCurrency === 'INR') {
        setExchangeRate(1);
        return;
      }
      
      const rate = await getCurrentExchangeRate(selectedCurrency, 'INR');
      setExchangeRate(rate);
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
      // Set fallback rates
      const fallbackRates = { USD: 83.50, AED: 22.74 };
      setExchangeRate(fallbackRates[selectedCurrency as keyof typeof fallbackRates] || 1);
    }
  };

  const calculateTotalCosts = async () => {
    const cost = parseFloat(costPerUser) || 0;
    const qty = parseInt(quantity) || 0;
    
    if (cost > 0 && qty > 0) {
      try {
        const totalINR = await calculateTotalCostInINR(cost, qty, selectedCurrency);
        setTotalCostINR(totalINR);
      } catch (err) {
        console.error('Error calculating total cost in INR:', err);
        // Fallback calculation
        setTotalCostINR(cost * qty * exchangeRate);
      }
    } else {
      setTotalCostINR(0);
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedCurrency('INR');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setCompany('');
    setAddress('');
    setGstTreatment('');
    setSourceOfSupply('');
    setGst('');
    setToolName('');
    setMake('');
    setModel('');
    setVersion('');
    setVendor('');
    setCostPerUser('');
    setQuantity('1');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setExpirationDate(new Date().toISOString().split('T')[0]);
    setError(null);
    setExchangeRate(1);
    setTotalCostINR(0);
    setBillFile(null);
    setBillFileName('');
  };

  const handleBillFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBillFile(file);
      setBillFileName(file.name);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (isOpen) {
        updateExchangeRate();
        
        try {
          const invoiceResponse = await fetch(`${getApiBaseUrl()}/licenses/next-invoice`);
          const invoiceResult = await invoiceResponse.json();
          if (invoiceResult.success && invoiceResult.data) {
            setInvoiceNo(invoiceResult.data.invoice_no);
          } else {
            console.error('Failed to fetch next invoice number:', invoiceResult.error);
            setInvoiceNo('CYB0001');
          }
        } catch (err) {
          console.error('Failed to fetch next invoice number:', err);
          setInvoiceNo('CYB0001');
        }
      }
    };
    
    fetchInitialData();
  }, [isOpen]);

  useEffect(() => {
    updateExchangeRate();
  }, [selectedCurrency]);

  useEffect(() => {
    calculateTotalCosts();
  }, [costPerUser, quantity, selectedCurrency, exchangeRate]);

  useEffect(() => {
    // Reset form when modal is closed
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const refreshExchangeRates = async () => {
    setRefreshingRates(true);
    try {
      // Invalidate cache to force fresh API call
      invalidateExchangeRatesCache();
      await updateExchangeRate();
    } finally {
      setRefreshingRates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const totalCost = calculateTotalCost();
      const totalCostInINRValue = await calculateTotalCostInINR(parseFloat(costPerUser), parseInt(quantity), selectedCurrency);

      const session = localStorage.getItem('auth_session');
      let authHeaders: Record<string, string> = {};
      if (session) {
        try {
          const userData = JSON.parse(session);
          if (userData.token) {
            authHeaders['Authorization'] = `Bearer ${userData.token}`;
          }
        } catch (e) {
          // Invalid session, ignore
        }
      }

      let response;
      
      if (billFile) {
        const formData = new FormData();
        formData.append('client_id', selectedClientId || '');
        formData.append('invoice_no', invoiceNo.trim() || '');
        formData.append('contact_person', contactPerson.trim() || '');
        formData.append('email', email.trim() || '');
        formData.append('phone', phone.trim() || '');
        formData.append('company', company.trim() || '');
        formData.append('address', address.trim() || '');
        formData.append('gst_treatment', gstTreatment.trim() || '');
        formData.append('source_of_supply', sourceOfSupply.trim() || '');
        formData.append('gst', gst.trim() || '');
        formData.append('tool_name', toolName);
        formData.append('make', make);
        formData.append('model', model);
        formData.append('version', version);
        formData.append('vendor', vendor);
        formData.append('cost_per_user', parseFloat(costPerUser).toString());
        formData.append('quantity', parseInt(quantity).toString());
        formData.append('total_cost', totalCost.toString());
        formData.append('total_cost_inr', totalCostInINRValue.toString());
        formData.append('purchase_date', purchaseDate);
        formData.append('expiration_date', expirationDate);
        formData.append('currency_code', selectedCurrency);
        formData.append('original_amount', totalCost.toString());
        formData.append('bill_file', billFile);

        response = await fetch(`${getApiBaseUrl()}/licenses`, {
          method: 'POST',
          headers: authHeaders,
          body: formData,
        });
      } else {
        const licenseData = {
          client_id: selectedClientId || null,
          invoice_no: invoiceNo.trim() || null,
          contact_person: contactPerson.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          company: company.trim() || null,
          address: address.trim() || null,
          gst_treatment: gstTreatment.trim() || null,
          source_of_supply: sourceOfSupply.trim() || null,
          gst: gst.trim() || null,
          tool_name: toolName,
          make,
          model,
          version,
          vendor,
          cost_per_user: parseFloat(costPerUser),
          quantity: parseInt(quantity),
          total_cost: totalCost,
          total_cost_inr: totalCostInINRValue,
          purchase_date: purchaseDate,
          expiration_date: expirationDate,
          currency_code: selectedCurrency,
          original_amount: totalCost
        };

        response = await fetch(`${getApiBaseUrl()}/licenses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(licenseData),
        });
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create license purchase');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create license purchase');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New License</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
            <label htmlFor="invoiceNo" className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Invoice Number (Auto-Generated)
            </label>
            <input
              id="invoiceNo"
              type="text"
              value={invoiceNo}
              readOnly
              className="block w-full rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-dark-800 px-4 py-3 text-lg font-bold text-blue-600 dark:text-blue-400 cursor-not-allowed"
              placeholder="Loading..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="billFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload Bill/Invoice (Optional)
              </label>
              <div className="mt-1">
                <label 
                  htmlFor="billFile" 
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg cursor-pointer bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
                >
                  {billFileName ? (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm truncate max-w-[200px]">{billFileName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Choose file</span>
                    </div>
                  )}
                </label>
                <input
                  id="billFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleBillFileChange}
                  className="hidden"
                />
                {billFileName && (
                  <button
                    type="button"
                    onClick={() => {
                      setBillFile(null);
                      setBillFileName('');
                    }}
                    className="mt-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Remove file
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contact Person
              </label>
              <input
                id="contactPerson"
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Company
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                placeholder="Enter company name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Address
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              placeholder="Enter complete address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="gstTreatment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                GST Treatment
              </label>
              <select
                id="gstTreatment"
                value={gstTreatment}
                onChange={(e) => setGstTreatment(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              >
                <option value="">Select GST treatment</option>
                <option value="Registered Business - Regular">Registered Business - Regular</option>
                <option value="Registered Business - Composition">Registered Business - Composition</option>
                <option value="Unregistered Business">Unregistered Business</option>
                <option value="Consumer">Consumer</option>
                <option value="Overseas">Overseas</option>
              </select>
            </div>

            <div>
              <label htmlFor="sourceOfSupply" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Source of Supply
              </label>
              <input
                id="sourceOfSupply"
                type="text"
                value={sourceOfSupply}
                onChange={(e) => setSourceOfSupply(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                placeholder="Enter source of supply"
              />
            </div>

            <div>
              <label htmlFor="gst" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                GST Number
              </label>
              <input
                id="gst"
                type="text"
                value={gst}
                onChange={(e) => setGst(e.target.value.toUpperCase())}
                maxLength={15}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                placeholder="Enter GST number (15 chars)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="toolName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tool Name *
            </label>
            <input
              id="toolName"
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Make
              </label>
              <input
                id="make"
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Model
              </label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              />
            </div>

            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Version
              </label>
              <input
                id="version"
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Vendor
            </label>
            <input
              id="vendor"
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="costPerUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cost per User *
              </label>
              <div className="mt-1 relative">
                <div className="flex gap-2 mb-2">
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                    aria-label="Select currency"
                  >
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={refreshExchangeRates}
                    disabled={refreshingRates || selectedCurrency === 'INR'}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={selectedCurrency === 'INR' ? 'Base currency - no conversion needed' : 'Refresh exchange rates'}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshingRates ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm pointer-events-none">
                    {getCurrentCurrency()?.symbol || '₹'}
                  </span>
                  <input
                    id="costPerUser"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPerUser}
                    onChange={(e) => setCostPerUser(e.target.value)}
                    className="pl-8 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of Licenses *
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Purchase Date *
              </label>
              <input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => {
                  setPurchaseDate(e.target.value);
                  // Reset expiration date if it's before the new purchase date
                  const newPurchaseDate = new Date(e.target.value);
                  const currentExpiration = new Date(expirationDate);
                  if (currentExpiration < newPurchaseDate) {
                    setExpirationDate('');
                  }
                }}
                max={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                required
              />
            </div>

            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Expiration Date *
              </label>
              <input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-dark-600">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Cost ({selectedCurrency}):</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{getCurrentCurrency()?.symbol}{calculateTotalCost().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Cost (INR):</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">₹{totalCostINR.toFixed(2)}</span>
              </div>
              {selectedCurrency !== 'INR' && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Exchange Rate: 1 {selectedCurrency} = ₹{exchangeRate.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Add License'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddLicenseModal;