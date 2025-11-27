import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

interface LicensePurchase {
  id: string;
  serial_no: string;
  client_id: string;
  invoice_no: string;
  tool_name: string;
  make: string;
  model: string;
  version: string;
  vendor: string;
  cost_per_user: number;
  quantity: number;
  total_cost: number;
  total_cost_inr: number;
  original_amount?: number;
  currency_code?: string;
  purchase_date: string;
  expiration_date: string;
  client_name?: string; // Client name from API join
  client_email?: string;
  client_phone?: string;
  client?: {
    name: string;
  };
}

interface ManageLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string;
  onSuccess: () => void;
}

function ManageLicenseModal({ isOpen, onClose, purchaseId, onSuccess }: ManageLicenseModalProps) {
  const [purchase, setPurchase] = useState<LicensePurchase | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({
    client_id: '',
    tool_name: '',
    invoice_no: '',
    serial_no: '',
    make: '',
    model: '',
    version: '',
    vendor: '',
    quantity: 1,
    cost_per_user: 0,
    total_cost: 0,
    total_cost_inr: 0,
    original_amount: 0,
    currency_code: 'INR',
    purchase_date: '',
    expiration_date: ''
  });

  useEffect(() => {
    if (isOpen && purchaseId) {
      fetchPurchase();
      fetchClients();
    } else {
      resetState();
    }
  }, [isOpen, purchaseId]);

  useEffect(() => {
    if (purchase) {
      setEditedFields({
        client_id: purchase.client_id || '',
        tool_name: purchase.tool_name || '',
        invoice_no: purchase.invoice_no || '',
        serial_no: purchase.serial_no || '',
        make: purchase.make || '',
        model: purchase.model || '',
        version: purchase.version || '',
        vendor: purchase.vendor || '',
        quantity: purchase.quantity || 1,
        cost_per_user: purchase.cost_per_user || 0,
        total_cost: purchase.total_cost || 0,
        total_cost_inr: purchase.total_cost_inr || 0,
        original_amount: purchase.original_amount || purchase.total_cost || 0,
        currency_code: purchase.currency_code || 'INR',
        purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : '',
        expiration_date: purchase.expiration_date ? purchase.expiration_date.split('T')[0] : ''
      });
    }
  }, [purchase]);

  const resetState = () => {
    setPurchase(null);
    setClients([]);
    setError(null);
    setDateError(null);
    setIsEditing(false);
    setEditedFields({
      client_id: '',
      tool_name: '',
      invoice_no: '',
      serial_no: '',
      make: '',
      model: '',
      version: '',
      vendor: '',
      quantity: 1,
      cost_per_user: 0,
      total_cost: 0,
      total_cost_inr: 0,
      original_amount: 0,
      currency_code: 'INR',
      purchase_date: '',
      expiration_date: ''
    });
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/clients`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setClients(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      setError(null);
      setDateError(null);

      // Since we don't have individual license endpoint, we'll fetch all licenses 
      // and find the one we need
      const response = await fetch(`${getApiBaseUrl()}/licenses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch licenses');
      }

      const licenses = result.data || [];
      const targetLicense = licenses.find((license: LicensePurchase) => license.id === purchaseId);
      
      if (!targetLicense) {
        throw new Error('License not found or you do not have permission to view it');
      }

      setPurchase(targetLicense);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch license purchase';
      setError(errorMessage);
      
      if (errorMessage.includes('License not found') || errorMessage.includes('permission')) {
        setTimeout(() => onClose(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateDates = (expirationDate: string): boolean => {
    if (!purchase) return false;

    const purchaseDate = new Date(purchase.purchase_date);
    const newExpirationDate = new Date(expirationDate);
    const today = new Date();
    
    // Set times to midnight for accurate date comparison
    purchaseDate.setHours(0, 0, 0, 0);
    newExpirationDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (newExpirationDate < purchaseDate) {
      setDateError('Expiration date cannot be earlier than the purchase date');
      return false;
    }

    if (newExpirationDate < today) {
      setDateError('Expiration date cannot be in the past');
      return false;
    }

    setDateError(null);
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDates(editedFields.expiration_date)) {
      return;
    }

    setLoading(true);
    setError(null);
    setDateError(null);

    try {
      // Use direct API call to update license
      // Note: We don't send quantity as it's managed automatically by the system
      const response = await fetch(`${getApiBaseUrl()}/licenses/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: editedFields.client_id || null,
          tool_name: editedFields.tool_name.trim(),
          invoice_no: editedFields.invoice_no.trim() || null,
          serial_no: editedFields.serial_no.trim() || null,
          make: editedFields.make.trim(),
          model: editedFields.model.trim(),
          version: editedFields.version.trim(),
          vendor: editedFields.vendor.trim(),
          quantity: purchase?.quantity ?? editedFields.quantity,
          cost_per_user: editedFields.cost_per_user,
          total_cost: editedFields.total_cost,
          total_cost_inr: editedFields.total_cost_inr,
          original_amount: editedFields.original_amount,
          currency_code: editedFields.currency_code,
          purchase_date: editedFields.purchase_date,
          expiration_date: editedFields.expiration_date
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update license purchase');
      }

      setPurchase(result.data);
      setIsEditing(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update license purchase');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'INR' | 'AED' = 'INR') => {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } else if (currency === 'AED') {
      return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (!isOpen) return null;

  if (loading && !purchase) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading license details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg p-6 w-full max-w-md overflow-auto max-h-[90vh]">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">Manage License</h2>
      <button 
        onClick={onClose}
        type="button" 
        className="text-gray-500 hover:text-gray-700"
        aria-label="Close modal"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    {error && (
      <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
        {error}
      </div>
    )}

    {purchase && (
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Serial Number</label>
          <p className="mt-1 text-sm font-mono text-gray-900">{purchase.serial_no}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Client</label>
          {isEditing ? (
            <select
              value={editedFields.client_id}
              onChange={(e) => setEditedFields({ ...editedFields, client_id: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Select client"
            >
              <option value="">No Client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-1 text-sm text-gray-900">{purchase.client_name || purchase.client?.name || 'No Client'}</p>
          )}
        </div>

        <div>
          <label htmlFor="tool-name-input" className="block text-sm font-medium text-gray-700">Tool Name</label>
          {isEditing ? (
            <input
              id="tool-name-input"
              type="text"
              value={editedFields.tool_name}
              onChange={(e) => setEditedFields({ ...editedFields, tool_name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter tool name"
            />
          ) : (
            <p className="mt-1 text-sm text-gray-900">{purchase.tool_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
          {isEditing ? (
            <input
              type="text"
              value={editedFields.invoice_no}
              onChange={(e) => setEditedFields({ ...editedFields, invoice_no: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter invoice number"
            />
          ) : (
            <p className="mt-1 text-sm text-gray-900">{purchase.invoice_no || 'N/A'}</p>
          )}
        </div>

        <div>
          <label htmlFor="make-input" className="block text-sm font-medium text-gray-700">Make</label>
          {isEditing ? (
            <input
              id="make-input"
              type="text"
              value={editedFields.make}
              onChange={(e) => setEditedFields({ ...editedFields, make: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <p className="mt-1 text-sm text-gray-900">{purchase.make || 'N/A'}</p>
          )}
        </div>

        <div>
          <label htmlFor="model-input" className="block text-sm font-medium text-gray-700">Model</label>
          {isEditing ? (
            <input
              id="model-input"
              type="text"
              value={editedFields.model}
              onChange={(e) => setEditedFields({ ...editedFields, model: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <p className="mt-1 text-sm text-gray-900">{purchase.model || 'N/A'}</p>
          )}
        </div>

        <div>
          <label htmlFor="version-input" className="block text-sm font-medium text-gray-700">Version</label>
          {isEditing ? (
            <input
              id="version-input"
              type="text"
              value={editedFields.version}
              onChange={(e) => setEditedFields({ ...editedFields, version: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <p className="mt-1 text-sm text-gray-900">{purchase.version || 'N/A'}</p>
          )}
        </div>

        <div>
          <label htmlFor="vendor-input" className="block text-sm font-medium text-gray-700">Vendor</label>
          {isEditing ? (
            <input
              id="vendor-input"
              type="text"
              value={editedFields.vendor}
              onChange={(e) => setEditedFields({ ...editedFields, vendor: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <p className="mt-1 text-sm text-gray-900">{purchase.vendor || 'N/A'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cost per User</label>
          <div className="mt-1 space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {formatCurrency(purchase.cost_per_user, (purchase.currency_code as 'USD' | 'INR' | 'AED') || 'INR')}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Available Licenses</label>
          <p className="mt-1 text-sm text-gray-900 font-semibold text-blue-600">{purchase.quantity}</p>
          <p className="text-xs text-gray-500 mt-1">This value is automatically managed and cannot be edited</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Total Cost</label>
          <div className="mt-1 space-y-1">
            {(() => {
              // Always show total cost in INR
              let totalCostINR = purchase.total_cost_inr;
              
              // If total_cost_inr is 0 or null, convert from original currency
              if (!totalCostINR || totalCostINR === 0) {
                const currency = purchase.currency_code || 'INR';
                const originalTotal = purchase.total_cost || (purchase.cost_per_user * purchase.quantity);
                
                if (currency === 'USD') {
                  totalCostINR = originalTotal * 83.0; // Convert USD to INR
                } else if (currency === 'AED') {
                  totalCostINR = originalTotal * 22.74; // Convert AED to INR
                } else {
                  totalCostINR = originalTotal; // Already in INR
                }
              }
              
              return (
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(totalCostINR, 'INR')}
                </p>
              );
            })()}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(purchase.purchase_date).toLocaleDateString()}
          </p>
        </div>

        <div>
          <label htmlFor="expiration-input" className="block text-sm font-medium text-gray-700">Expiration Date</label>
          {isEditing ? (
            <div>
              <input
                id="expiration-input"
                type="date"
                value={editedFields.expiration_date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setEditedFields({ ...editedFields, expiration_date: newDate });
                  validateDates(newDate);
                }}
                min={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                  dateError 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {dateError && (
                <p className="mt-1 text-sm text-red-600">{dateError}</p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-900">
              {new Date(purchase.expiration_date).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          {isEditing ? (
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !!dateError}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setDateError(null);
                  if (purchase) {
                    setEditedFields({
                      client_id: purchase.client_id || '',
                      tool_name: purchase.tool_name || '',
                      invoice_no: purchase.invoice_no || '',
                      serial_no: purchase.serial_no || '',
                      make: purchase.make || '',
                      model: purchase.model || '',
                      version: purchase.version || '',
                      vendor: purchase.vendor || '',
                      quantity: purchase.quantity || 1,
                      cost_per_user: purchase.cost_per_user || 0,
                      total_cost: purchase.total_cost || 0,
                      total_cost_inr: purchase.total_cost_inr || 0,
                      original_amount: purchase.original_amount || purchase.total_cost || 0,
                      currency_code: purchase.currency_code || 'INR',
                      purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : '',
                      expiration_date: purchase.expiration_date ? purchase.expiration_date.split('T')[0] : ''
                    });
                  }
                }}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit License
            </button>
          )}
        </div>
      </form>
    )}
  </div>
</div>

  );
}

export default ManageLicenseModal;