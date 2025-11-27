import React, { useState, useEffect } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

interface MultiStepLicenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function MultiStepLicenseForm({ isOpen, onClose, onSuccess }: MultiStepLicenseFormProps) {
  // Form state - simplified for single step
  const [vendors, setVendors] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [toolName, setToolName] = useState('');
  const [costPerUser, setCostPerUser] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState(new Date().toISOString().split('T')[0]);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billFileName, setBillFileName] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendors and currencies when form opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vendors
        const vendorsResponse = await fetch(`${getApiBaseUrl()}/vendors`);
        const vendorsResult = await vendorsResponse.json();
        if (vendorsResult.success) {
          setVendors(vendorsResult.data || []);
        }

        // Fetch currencies
        const currenciesResponse = await fetch(`${getApiBaseUrl()}/currencies`);
        const currenciesResult = await currenciesResponse.json();
        if (currenciesResult.success) {
          setCurrencies(currenciesResult.data || []);
        }

        // Fetch next invoice number
        const invoiceResponse = await fetch(`${getApiBaseUrl()}/licenses/next-invoice`);
        const invoiceResult = await invoiceResponse.json();
        if (invoiceResult.success && invoiceResult.data) {
          setInvoiceNo(invoiceResult.data.invoice_no);
        } else {
          console.error('Failed to fetch next invoice number:', invoiceResult.error);
          setInvoiceNo('CYB0001');
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setInvoiceNo('CYB0001');
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Auto-fill vendor information when vendor is selected
  useEffect(() => {
    if (selectedVendorId && vendors.length > 0) {
      const selectedVendor = vendors.find(v => String(v.id) === String(selectedVendorId));
      if (selectedVendor) {
        // Auto-fill cost per user if vendor has amount
        if (selectedVendor.amount && parseFloat(selectedVendor.amount) > 0) {
          setCostPerUser(String(selectedVendor.amount));
        }
        // Auto-fill quantity if vendor has quantity
        if (selectedVendor.quantity && parseInt(selectedVendor.quantity) > 0) {
          setQuantity(String(selectedVendor.quantity));
        }
      }
    }
  }, [selectedVendorId, vendors]);

  // Get vendor's currency
  const getVendorCurrency = () => {
    if (!selectedVendorId || vendors.length === 0) return null;
    const vendor = vendors.find(v => String(v.id) === String(selectedVendorId));
    if (!vendor || !vendor.currency_id) return null;
    return currencies.find(c => String(c.id) === String(vendor.currency_id));
  };

  // Get currency symbol by code
  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'SGD': 'S$',
      'AED': 'د.إ',
      'SAR': '﷼',
    };
    return symbols[currencyCode] || currencyCode + ' ';
  };

  // Convert amount to INR based on vendor's currency
  const convertToINR = (amount: number) => {
    const vendorCurrency = getVendorCurrency();
    if (!vendorCurrency) return amount;
    
    // If already INR, no conversion needed
    if (vendorCurrency.code === 'INR') return amount;
    
    // Convert using exchange rate (exchange_rate_to_inr from currency table)
    const exchangeRate = parseFloat(vendorCurrency.exchange_rate_to_inr) || 1;
    return amount * exchangeRate;
  };

  // Calculate Amount (Cost × Quantity) in vendor's currency
  const calculateAmount = () => {
    const cost = parseFloat(costPerUser) || 0;
    const qty = parseInt(quantity) || 0;
    return cost * qty;
  };

  // Calculate Amount in INR (converted from vendor's currency)
  const calculateAmountINR = () => {
    return convertToINR(calculateAmount());
  };

  // Calculate GST Amount (18% of Amount in INR)
  const calculateGSTAmount = () => {
    return calculateAmountINR() * 0.18;
  };

  const handleBillFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, JPG, PNG, DOC, and DOCX files are allowed');
        return;
      }
      setBillFile(file);
      setBillFileName(file.name);
      setError(null);
    }
  };

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedVendorId('');
    setToolName('');
    setCostPerUser('');
    setQuantity('1');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setExpirationDate('');
    setBillFile(null);
    setBillFileName('');
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedVendorId) {
      setError('Please select a vendor');
      return;
    }
    if (!toolName.trim()) {
      setError('Item Name is required');
      return;
    }
    if (!costPerUser || parseFloat(costPerUser) <= 0) {
      setError('Cost is required and must be greater than 0');
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      setError('Quantity is required and must be greater than 0');
      return;
    }
    if (!purchaseDate) {
      setError('Purchase Date is required');
      return;
    }
    if (!expirationDate) {
      setError('Expiration Date is required');
      return;
    }

    setLoading(true);

    try {
      // Get selected vendor name
      const selectedVendor = vendors.find(v => String(v.id) === selectedVendorId);
      const vendorName = selectedVendor?.name || '';

      // Calculate totals in INR
      const amount = calculateAmount();
      const total = calculateAmountINR();
      const costPerUserINR = convertToINR(parseFloat(costPerUser));

      // Get vendor's currency code
      const vendorCurrency = getVendorCurrency();
      const currencyCode = vendorCurrency ? vendorCurrency.code : 'INR';

      let licenseResponse;

      if (billFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('client_id', selectedClientId || '');
        formData.append('vendor_id', selectedVendorId);
        formData.append('vendor', vendorName);
        formData.append('invoice_no', invoiceNo.trim() || '');
        formData.append('tool_name', toolName.trim());
        formData.append('make', '');
        formData.append('model', '');
        formData.append('version', '');
        formData.append('cost_per_user', costPerUserINR.toString());
        formData.append('quantity', parseInt(quantity).toString());
        formData.append('total_cost', total.toString());
        formData.append('total_cost_inr', total.toString());
        formData.append('purchase_date', purchaseDate);
        formData.append('expiration_date', expirationDate);
        formData.append('currency_code', currencyCode);
        formData.append('original_amount', amount.toString());
        formData.append('bill_file', billFile);

        licenseResponse = await fetch(`${getApiBaseUrl()}/licenses`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use JSON for regular submission
        const licenseData = {
          client_id: selectedClientId || null,
          vendor_id: selectedVendorId,
          vendor: vendorName,
          invoice_no: invoiceNo.trim() || null,
          tool_name: toolName.trim(),
          make: null,
          model: null,
          version: null,
          cost_per_user: costPerUserINR,
          quantity: parseInt(quantity),
          total_cost: total,
          total_cost_inr: total,
          purchase_date: purchaseDate,
          expiration_date: expirationDate,
          currency_code: currencyCode,
          original_amount: amount
        };

        licenseResponse = await fetch(`${getApiBaseUrl()}/licenses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(licenseData),
        });
      }
      
      const licenseResult = await licenseResponse.json();
      
      console.log('License creation response:', licenseResult);
      
      if (!licenseResult.success) {
        console.error('License creation failed:', licenseResult);
        const errorMsg = licenseResult.error || licenseResult.message || 'Failed to create license purchase';
        const debugInfo = licenseResult.debug ? JSON.stringify(licenseResult.debug, null, 2) : '';
        throw new Error(`${errorMsg}${debugInfo ? '\n\nDebug Info:\n' + debugInfo : ''}`);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Purchase License
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700" 
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-800">
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

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-700 dark:to-dark-700 rounded-xl p-6 border border-blue-100 dark:border-dark-600 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="vendorId" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  id="vendorId"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                  required
                >
                  <option value="">Select a vendor</option>
                  {vendors && vendors.length > 0 && vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedVendorId && vendors.length > 0 && (() => {
              const selectedVendor = vendors.find(v => String(v.id) === String(selectedVendorId));
              if (selectedVendor) {
                return (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Vendor Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {selectedVendor.name && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Vendor Name: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.name}</span>
                        </div>
                      )}
                      {selectedVendor.contact_person && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Contact Person: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.contact_person}</span>
                        </div>
                      )}
                      {selectedVendor.email && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Email: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.email}</span>
                        </div>
                      )}
                      {selectedVendor.phone && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Phone: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.phone}</span>
                        </div>
                      )}
                      {selectedVendor.company_name && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Company: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.company_name}</span>
                        </div>
                      )}
                      {selectedVendor.gst_treatment && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">GST Treatment: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.gst_treatment}</span>
                        </div>
                      )}
                      {selectedVendor.source_of_supply && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Source of Supply: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.source_of_supply}</span>
                        </div>
                      )}
                      {selectedVendor.gst && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">GST Number: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.gst}</span>
                        </div>
                      )}
                      {selectedVendor.currency_id && (() => {
                        const currency = currencies.find(c => String(c.id) === String(selectedVendor.currency_id));
                        if (currency) {
                          return (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Currency: </span>
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                {currency.code} ({currency.symbol})
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {selectedVendor.address && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600 dark:text-gray-400">Address: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedVendor.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div>
              <label htmlFor="toolName" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                id="toolName"
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="costPerUser" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Cost ({getVendorCurrency()?.code || 'INR'}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-semibold pointer-events-none">
                    {getVendorCurrency()?.symbol || '₹'}
                  </span>
                  <input
                    id="costPerUser"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPerUser}
                    onChange={(e) => setCostPerUser(e.target.value)}
                    className="pl-10 block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => {
                    setPurchaseDate(e.target.value);
                    const newPurchaseDate = new Date(e.target.value);
                    const currentExpiration = new Date(expirationDate);
                    if (currentExpiration < newPurchaseDate) {
                      setExpirationDate('');
                    }
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="expirationDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Expiration Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="expirationDate"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800 space-y-3">
              {(() => {
                const vendorCurrency = getVendorCurrency();
                const currencyCode = vendorCurrency?.code || 'INR';
                const currencySymbol = getCurrencySymbol(currencyCode);
                const isNotINR = currencyCode !== 'INR';
                
                return (
                  <>
                    {isNotINR && (
                      <div className="flex justify-between items-center text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Amount (in {currencyCode}):</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {currencySymbol}{calculateAmount().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Amount (in INR):</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{calculateAmountINR().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">GST Amount (18%):</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{calculateGSTAmount().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-blue-300 dark:border-blue-700">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount (INR):</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ₹{(calculateAmountINR() + calculateGSTAmount()).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div>
              <label htmlFor="billFile" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Upload Bill/Invoice (Optional)
              </label>
              <div className="mt-1">
                <label 
                  htmlFor="billFile" 
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-gray-200 dark:border-dark-600 rounded-xl cursor-pointer bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
                >
                  {billFileName ? (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm truncate max-w-[300px]">{billFileName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">Choose file (PDF, JPG, PNG, DOC, DOCX)</span>
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
                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                  >
                    Remove file
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-600">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-semibold hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
            >
              {loading ? 'Creating...' : 'Create Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MultiStepLicenseForm;
