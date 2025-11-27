import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';

interface CompanySettings {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_logo_path: string;
  company_website: string;
  company_gst: string;
}

interface LicensePurchase {
  id: string;
  serial_no: string;
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
  currency_code?: string;
  purchase_date: string;
  expiration_date: string;
  client_name?: string;
}

interface Sale {
  id: string;
  invoice_no: string;
  tool_name: string;
  vendor: string;
  quantity: number;
  purchase_amount: number;
  purchase_gst: number;
  total_purchase_cost: number;
  selling_amount: number;
  selling_gst: number;
  total_selling_price: number;
  net_gst_paid: number;
  margin: number;
  sale_date: string;
  expiry_date: string;
  client_name?: string;
  make?: string;
  model?: string;
  version?: string;
}

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseId: string;
  type: 'purchase' | 'sale';
}

function PrintInvoiceModal({ isOpen, onClose, licenseId, type }: PrintInvoiceModalProps) {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [licenseData, setLicenseData] = useState<LicensePurchase | Sale | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && licenseId) {
      fetchData();
    }
  }, [isOpen, licenseId, type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch company settings
      const settingsResponse = await fetch(`${getApiBaseUrl()}/company-settings`);
      const settingsResult = await settingsResponse.json();
      if (settingsResult.success) {
        setCompanySettings(settingsResult.data);
      }

      // Fetch license data
      const endpoint = type === 'purchase' ? `/licenses/${licenseId}` : `/sales/${licenseId}`;
      const licenseResponse = await fetch(`${getApiBaseUrl()}${endpoint}`);
      const licenseResult = await licenseResponse.json();
      if (licenseResult.success) {
        setLicenseData(licenseResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:overflow-visible">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay - hidden when printing */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 print:hidden"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full print:shadow-none print:max-w-none print:block">
          {/* Header - hidden when printing */}
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <Printer className="h-6 w-6 text-white" />
              <h3 className="text-lg font-semibold text-white">
                Print {type === 'purchase' ? 'Purchase' : 'Selling'} License
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Printer className="h-5 w-5" />
                Print
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content - printable area */}
          <div className="px-8 py-6 print:px-12 print:py-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Header with Logo and Company Info */}
                <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-300">
                  {/* Left: Company Logo */}
                  <div className="flex-shrink-0">
                    {companySettings?.company_logo_path ? (
                      <img
                        src={companySettings.company_logo_path}
                        alt="Company Logo"
                        className="h-20 w-auto object-contain"
                      />
                    ) : (
                      <div className="h-20 w-32 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500 text-xs">No Logo</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Company Information */}
                  <div className="text-right">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {companySettings?.company_name || 'Company Name'}
                    </h1>
                    <div className="text-sm text-gray-600 space-y-1">
                      {companySettings?.company_address && (
                        <p>{companySettings.company_address}</p>
                      )}
                      {companySettings?.company_phone && (
                        <p>Phone: {companySettings.company_phone}</p>
                      )}
                      {companySettings?.company_email && (
                        <p>Email: {companySettings.company_email}</p>
                      )}
                      {companySettings?.company_website && (
                        <p>Website: {companySettings.company_website}</p>
                      )}
                      {companySettings?.company_gst && (
                        <p className="font-medium">GST: {companySettings.company_gst}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoice Title */}
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {type === 'purchase' ? 'Purchase License' : 'Selling License'}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Invoice Date: {new Date().toLocaleDateString('en-IN')}
                  </p>
                </div>

                {/* License Details */}
                {licenseData && type === 'purchase' && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase border-b pb-2">
                          License Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">License Name:</span>
                            <span className="font-medium text-gray-900">{(licenseData as LicensePurchase).tool_name}</span>
                          </div>
                          {(licenseData as LicensePurchase).make && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Make:</span>
                              <span className="font-medium text-gray-900">{(licenseData as LicensePurchase).make}</span>
                            </div>
                          )}
                          {(licenseData as LicensePurchase).model && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Model:</span>
                              <span className="font-medium text-gray-900">{(licenseData as LicensePurchase).model}</span>
                            </div>
                          )}
                          {(licenseData as LicensePurchase).version && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Version:</span>
                              <span className="font-medium text-gray-900">{(licenseData as LicensePurchase).version}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vendor:</span>
                            <span className="font-medium text-gray-900">{(licenseData as LicensePurchase).vendor}</span>
                          </div>
                          {(licenseData as LicensePurchase).invoice_no && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Invoice No:</span>
                              <span className="font-medium text-gray-900">{(licenseData as LicensePurchase).invoice_no}</span>
                            </div>
                          )}
                          {(licenseData as LicensePurchase).serial_no && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Serial No:</span>
                              <span className="font-medium text-gray-900">{(licenseData as LicensePurchase).serial_no}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase border-b pb-2">
                          Purchase Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Purchase Date:</span>
                            <span className="font-medium text-gray-900">
                              {format(new Date((licenseData as LicensePurchase).purchase_date), 'dd MMM yyyy')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Expiration Date:</span>
                            <span className="font-medium text-gray-900">
                              {format(new Date((licenseData as LicensePurchase).expiration_date), 'dd MMM yyyy')}
                            </span>
                          </div>
                          {(licenseData as LicensePurchase).client_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Client:</span>
                              <span className="font-medium text-gray-900">{(licenseData as LicensePurchase).client_name}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium text-gray-900">{(licenseData as LicensePurchase).quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cost Breakdown Table */}
                    <div className="mt-8">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Cost Breakdown</h3>
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Description</th>
                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Quantity</th>
                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Rate</th>
                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 text-sm">{(licenseData as LicensePurchase).tool_name}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm">{(licenseData as LicensePurchase).quantity}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                              {formatCurrency((licenseData as LicensePurchase).cost_per_user, (licenseData as LicensePurchase).currency_code || 'INR')}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">
                              {formatCurrency((licenseData as LicensePurchase).total_cost_inr, 'INR')}
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">
                              Total Amount:
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-lg font-bold text-blue-600">
                              {formatCurrency((licenseData as LicensePurchase).total_cost_inr, 'INR')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {licenseData && type === 'sale' && (
                  <div className="space-y-6">
                    {/* Basic Information for Sale */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase border-b pb-2">
                          License Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">License Name:</span>
                            <span className="font-medium text-gray-900">{(licenseData as Sale).tool_name}</span>
                          </div>
                          {(licenseData as Sale).make && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Make:</span>
                              <span className="font-medium text-gray-900">{(licenseData as Sale).make}</span>
                            </div>
                          )}
                          {(licenseData as Sale).model && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Model:</span>
                              <span className="font-medium text-gray-900">{(licenseData as Sale).model}</span>
                            </div>
                          )}
                          {(licenseData as Sale).version && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Version:</span>
                              <span className="font-medium text-gray-900">{(licenseData as Sale).version}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vendor:</span>
                            <span className="font-medium text-gray-900">{(licenseData as Sale).vendor}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Invoice No:</span>
                            <span className="font-medium text-gray-900">{(licenseData as Sale).invoice_no}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase border-b pb-2">
                          Sale Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sale Date:</span>
                            <span className="font-medium text-gray-900">
                              {format(new Date((licenseData as Sale).sale_date), 'dd MMM yyyy')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Expiry Date:</span>
                            <span className="font-medium text-gray-900">
                              {format(new Date((licenseData as Sale).expiry_date), 'dd MMM yyyy')}
                            </span>
                          </div>
                          {(licenseData as Sale).client_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Client:</span>
                              <span className="font-medium text-gray-900">{(licenseData as Sale).client_name}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium text-gray-900">{(licenseData as Sale).quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Breakdown Table */}
                    <div className="mt-8">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Financial Breakdown</h3>
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Item</th>
                            <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 text-sm">Purchase Amount</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                              {formatCurrency((licenseData as Sale).purchase_amount, 'INR')}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 text-sm">Purchase GST</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                              {formatCurrency((licenseData as Sale).purchase_gst, 'INR')}
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 text-sm font-semibold">Total Purchase Cost</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">
                              {formatCurrency((licenseData as Sale).total_purchase_cost, 'INR')}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 text-sm">Selling Amount</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                              {formatCurrency((licenseData as Sale).selling_amount, 'INR')}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 text-sm">Selling GST</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                              {formatCurrency((licenseData as Sale).selling_gst, 'INR')}
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 text-sm font-semibold">Total Selling Price</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">
                              {formatCurrency((licenseData as Sale).total_selling_price, 'INR')}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-4 py-2 text-sm">Net GST Paid</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                              {formatCurrency((licenseData as Sale).net_gst_paid, 'INR')}
                            </td>
                          </tr>
                          <tr className="bg-blue-50">
                            <td className="border border-gray-300 px-4 py-2 text-sm font-bold">Profit Margin</td>
                            <td className="border border-gray-300 px-4 py-2 text-right text-lg font-bold text-green-600">
                              {formatCurrency((licenseData as Sale).margin, 'INR')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer with Company Info */}
                <div className="mt-12 pt-6 border-t-2 border-gray-300">
                  <div className="text-center text-sm text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">{companySettings?.company_name || 'Company Name'}</p>
                    {companySettings?.company_address && <p>{companySettings.company_address}</p>}
                    <div className="flex justify-center gap-4">
                      {companySettings?.company_phone && <span>Phone: {companySettings.company_phone}</span>}
                      {companySettings?.company_email && <span>Email: {companySettings.company_email}</span>}
                    </div>
                    {companySettings?.company_website && <p>Website: {companySettings.company_website}</p>}
                    {companySettings?.company_gst && <p className="font-medium">GST: {companySettings.company_gst}</p>}
                  </div>
                  <div className="text-center mt-4 text-xs text-gray-500">
                    <p>This is a computer-generated document. No signature is required.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer buttons - hidden when printing */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 print:hidden">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="h-5 w-5" />
              Print Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:overflow-visible,
          .print\\:overflow-visible * {
            visibility: visible;
          }
          .print\\:overflow-visible {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}

export default PrintInvoiceModal;
