import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

interface SellLicenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function SellLicenseForm({ isOpen, onClose, onSuccess }: SellLicenseFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
  const [sellingAmount, setSellingAmount] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsResponse = await fetch(`${getApiBaseUrl()}/clients`);
        const clientsResult = await clientsResponse.json();
        if (clientsResult.success) {
          setClients(clientsResult.data || []);
        }

        const currenciesResponse = await fetch(`${getApiBaseUrl()}/currencies`);
        const currenciesResult = await currenciesResponse.json();
        if (currenciesResult.success) {
          setCurrencies(currenciesResult.data || []);
        }

        const purchasesResponse = await fetch(`${getApiBaseUrl()}/licenses`);
        const purchasesResult = await purchasesResponse.json();
        if (purchasesResult.success) {
          setPurchases(purchasesResult.data || []);
        }

        const invoiceResponse = await fetch(`${getApiBaseUrl()}/sales/next-invoice`);
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

  // Auto-fill expiry date when purchase is selected
  useEffect(() => {
    if (selectedPurchaseId && purchases.length > 0) {
      const selectedPurchase = purchases.find(p => String(p.id) === String(selectedPurchaseId));
      if (selectedPurchase && selectedPurchase.expiration_date) {
        // Set expiry date from purchase item's expiration date
        setExpiryDate(selectedPurchase.expiration_date.split('T')[0]);
      }
    }
  }, [selectedPurchaseId, purchases]);

  const getSelectedPurchase = () => {
    if (!selectedPurchaseId || purchases.length === 0) return null;
    return purchases.find(p => String(p.id) === String(selectedPurchaseId));
  };

  const getSelectedClient = () => {
    if (!selectedClientId || clients.length === 0) return null;
    return clients.find(c => String(c.id) === String(selectedClientId));
  };

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

  const calculatePurchaseAmount = () => {
    const purchase = getSelectedPurchase();
    if (!purchase) return 0;
    const costPerUser = parseFloat(purchase.cost_per_user) || 0;
    const qty = parseInt(quantity) || 0;
    return costPerUser * qty;
  };

  const calculatePurchaseGST = () => {
    return calculatePurchaseAmount() * 0.18;
  };

  const calculateTotalPurchaseCost = () => {
    return calculatePurchaseAmount() + calculatePurchaseGST();
  };

  const calculateSellingAmountTotal = () => {
    const amount = parseFloat(sellingAmount) || 0;
    const qty = parseInt(quantity) || 0;
    return amount * qty;
  };

  const calculateSellingGST = () => {
    return calculateSellingAmountTotal() * 0.18;
  };

  const calculateTotalSellingPrice = () => {
    return calculateSellingAmountTotal() + calculateSellingGST();
  };

  const calculateNetGSTPaid = () => {
    return calculateSellingGST() - calculatePurchaseGST();
  };

  const calculateMargin = () => {
    return calculateSellingAmountTotal() - calculatePurchaseAmount();
  };

  // Get client currency and conversion functions
  const getClientCurrency = () => {
    const client = getSelectedClient();
    if (!client) return null;
    
    const currency = currencies.find(c => String(c.id) === String(client.currency_id));
    return currency || null;
  };

  const convertINRToClientCurrency = (inrAmount: number) => {
    const currency = getClientCurrency();
    if (!currency) return 0;
    
    // Convert INR to client currency using exchange rate
    // exchange_rate_to_inr tells us how many INR = 1 unit of foreign currency
    // So to convert FROM INR, we divide by the exchange rate
    const exchangeRate = parseFloat(currency.exchange_rate_to_inr) || 1;
    if (exchangeRate === 0) return 0;
    
    return inrAmount / exchangeRate;
  };

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedPurchaseId('');
    setSellingAmount('');
    setQuantity('1');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setExpiryDate('');
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const purchase = getSelectedPurchase();
    if (purchase) {
      const availableQty = parseInt(purchase.quantity) || 1;
      if (parseInt(quantity) > availableQty) {
        setQuantity(String(availableQty));
      }
    }
  }, [selectedPurchaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }
    if (!selectedPurchaseId) {
      setError('Please select a purchase item');
      return;
    }
    if (!sellingAmount || parseFloat(sellingAmount) <= 0) {
      setError('Selling amount is required and must be greater than 0');
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      setError('Quantity is required and must be greater than 0');
      return;
    }
    if (!saleDate) {
      setError('Sale date is required');
      return;
    }

    const purchase = getSelectedPurchase();
    if (!purchase) {
      setError('Selected purchase not found');
      return;
    }

    const availableQty = parseInt(purchase.quantity) || 0;
    if (parseInt(quantity) > availableQty) {
      setError(`Only ${availableQty} items available in stock`);
      return;
    }

    // Validate expiry date - must be >= purchase expiry date
    if (expiryDate && purchase.expiration_date) {
      const saleExpiryDate = new Date(expiryDate);
      const purchaseExpiryDate = new Date(purchase.expiration_date);
      
      if (saleExpiryDate < purchaseExpiryDate) {
        const purchaseExpiryStr = purchaseExpiryDate.toLocaleDateString('en-IN');
        setError(`Expiry date must be on or after the purchase expiry date (${purchaseExpiryStr})`);
        return;
      }
    }

    setLoading(true);

    try {
      const saleData = {
        client_id: selectedClientId,
        purchase_id: selectedPurchaseId,
        tool_name: purchase.tool_name,
        vendor: purchase.vendor,
        invoice_no: invoiceNo.trim() || null,
        quantity: parseInt(quantity),
        purchase_amount: calculatePurchaseAmount(),
        purchase_gst: calculatePurchaseGST(),
        total_purchase_cost: calculateTotalPurchaseCost(),
        selling_amount: calculateSellingAmountTotal(),
        selling_gst: calculateSellingGST(),
        total_selling_price: calculateTotalSellingPrice(),
        net_gst_paid: calculateNetGSTPaid(),
        margin: calculateMargin(),
        sale_date: saleDate,
        expiry_date: expiryDate || null,
      };

      const response = await fetch(`${getApiBaseUrl()}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create sale');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedPurchase = getSelectedPurchase();
  const selectedClient = getSelectedClient();
  const maxQuantity = selectedPurchase ? parseInt(selectedPurchase.quantity) || 1 : 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sell License
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

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-dark-700 dark:to-dark-700 rounded-xl p-6 border border-green-100 dark:border-dark-600 space-y-5">
            
            <div>
              <label htmlFor="clientId" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Select Client <span className="text-red-500">*</span>
              </label>
              <select
                id="clientId"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/10 dark:focus:ring-green-400/20 transition-all"
                required
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.email ? `(${client.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {selectedClient.name && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Name: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedClient.name}</span>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Email: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Phone: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedClient.phone}</span>
                    </div>
                  )}
                  {selectedClient.company && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Company: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedClient.company}</span>
                    </div>
                  )}
                  {selectedClient.gst && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">GST Number: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedClient.gst}</span>
                    </div>
                  )}
                  {selectedClient.pan && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">PAN: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedClient.pan}</span>
                    </div>
                  )}
                  {selectedClient.gst_treatment && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">GST Treatment: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedClient.gst_treatment}</span>
                    </div>
                  )}
                  {selectedClient.place_of_supply && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Place of Supply: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedClient.place_of_supply}</span>
                    </div>
                  )}
                  {selectedClient.currency_name && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Currency: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {selectedClient.currency_name} ({selectedClient.currency_symbol || selectedClient.currency_code})
                      </span>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Address: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedClient.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="purchaseId" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Select Purchase Item <span className="text-red-500">*</span>
              </label>
              <select
                id="purchaseId"
                value={selectedPurchaseId}
                onChange={(e) => setSelectedPurchaseId(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/10 dark:focus:ring-green-400/20 transition-all"
                required
              >
                <option value="">Select a purchase</option>
                {purchases.filter(p => parseInt(p.quantity) > 0).map((purchase) => (
                  <option key={purchase.id} value={purchase.id}>
                    {purchase.tool_name} - {purchase.vendor} (Qty: {purchase.quantity}, Cost: ₹{parseFloat(purchase.cost_per_user).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {selectedPurchase && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Purchase Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Item Name: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedPurchase.tool_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Vendor: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedPurchase.vendor}</span>
                  </div>
                  {selectedPurchase.make && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Make: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedPurchase.make}</span>
                    </div>
                  )}
                  {selectedPurchase.model && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Model: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedPurchase.model}</span>
                    </div>
                  )}
                  {selectedPurchase.version && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Version: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedPurchase.version}</span>
                    </div>
                  )}
                  {selectedPurchase.invoice_no && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Invoice No: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedPurchase.invoice_no}</span>
                    </div>
                  )}
                  {selectedPurchase.currency_code && selectedPurchase.original_amount && selectedPurchase.currency_code !== 'INR' && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Original Cost/Unit: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {getCurrencySymbol(selectedPurchase.currency_code)}{(parseFloat(selectedPurchase.original_amount) / parseInt(selectedPurchase.quantity)).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Cost in INR/Unit: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      ₹{parseFloat(selectedPurchase.cost_per_user).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Qty Purchased: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{selectedPurchase.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Cost in INR: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      ₹{(parseFloat(selectedPurchase.cost_per_user) * parseInt(selectedPurchase.quantity)).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">GST (18%): </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      ₹{(parseFloat(selectedPurchase.cost_per_user) * parseInt(selectedPurchase.quantity) * 0.18).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                  {selectedPurchase.purchase_date && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Purchase Date: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{new Date(selectedPurchase.purchase_date).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                  {selectedPurchase.expiration_date && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Expiry Date: </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{new Date(selectedPurchase.expiration_date).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="sellingAmount" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Selling Amount per Unit (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-semibold pointer-events-none">
                    ₹
                  </span>
                  <input
                    id="sellingAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingAmount}
                    onChange={(e) => setSellingAmount(e.target.value)}
                    className="pl-10 block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/10 dark:focus:ring-green-400/20 transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Quantity <span className="text-red-500">*</span>
                  {selectedPurchase && <span className="text-xs text-gray-500 ml-2">(Max: {maxQuantity})</span>}
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/10 dark:focus:ring-green-400/20 transition-all"
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="saleDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Sale Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/10 dark:focus:ring-green-400/20 transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Expiry Date
                  {selectedPurchase?.expiration_date && (
                    <span className="text-xs text-gray-500 ml-2">
                      (Min: {new Date(selectedPurchase.expiration_date).toLocaleDateString('en-IN')})
                    </span>
                  )}
                </label>
                <input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/10 dark:focus:ring-green-400/20 transition-all"
                />
              </div>
            </div>

            {selectedPurchase && sellingAmount && quantity && (
              <div className="space-y-4 mt-6">
                <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                  <h3 className="text-sm font-bold text-orange-900 dark:text-orange-100 mb-3">Purchase Calculation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Purchase Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{calculatePurchaseAmount().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Purchase GST (18%):</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{calculatePurchaseGST().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-orange-300 dark:border-orange-700">
                      <span className="font-bold text-gray-900 dark:text-white">Total Purchase Cost:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        ₹{calculateTotalPurchaseCost().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-800 p-5 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <h3 className="text-sm font-bold text-green-900 dark:text-green-100 mb-3">Selling Calculation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Selling Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{calculateSellingAmountTotal().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Selling GST (18%):</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{calculateSellingGST().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-green-300 dark:border-green-700">
                      <span className="font-bold text-gray-900 dark:text-white">Total Selling Price:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ₹{calculateTotalSellingPrice().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Currency Conversion Section */}
                {getClientCurrency() && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3">
                      Client Currency Conversion ({getClientCurrency()?.code})
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Selling Amount (Converted):</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {getCurrencySymbol(getClientCurrency()?.code || '')}
                          {convertINRToClientCurrency(calculateSellingAmountTotal()).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700 dark:text-gray-300">GST (Converted):</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {getCurrencySymbol(getClientCurrency()?.code || '')}
                          {convertINRToClientCurrency(calculateSellingGST()).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-300 dark:border-blue-700">
                        <span className="font-bold text-gray-900 dark:text-white">Total (Converted):</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {getCurrencySymbol(getClientCurrency()?.code || '')}
                          {convertINRToClientCurrency(calculateTotalSellingPrice()).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                  <h3 className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-3">Profit Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Net GST Paid:</span>
                      <span className={`font-semibold ${calculateNetGSTPaid() >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        ₹{Math.abs(calculateNetGSTPaid()).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        {calculateNetGSTPaid() < 0 && ' (Refund)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-purple-300 dark:border-purple-700">
                      <span className="text-lg font-bold text-purple-900 dark:text-purple-100">Margin (Profit):</span>
                      <span className={`text-xl font-bold ${calculateMargin() >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                        ₹{calculateMargin().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 text-white font-semibold hover:from-green-700 hover:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40"
            >
              {loading ? 'Creating Sale...' : 'Create Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SellLicenseForm;
