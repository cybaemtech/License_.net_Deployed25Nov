import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Plus,
  Upload,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  X,
  User,
  MapPin,
  FileText,
  Hash,
  Receipt,
  Calendar,
  Eye,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";
import SimpleDocumentViewer from "../components/SimpleDocumentViewer";
import CSVImportModal from "../components/CSVImportModal";
import { getUserPermissions, hasPermission } from "../utils/permissionHelper";

interface Vendor {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  company_name: string;
  gst_treatment: string;
  source_of_supply: string;
  gst: string;
  currency_id: string;
  mode_of_payment: string;
  amount: number;
  quantity: number;
  document_path: string;
  created_at: string;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_inr: number;
}

function Vendors() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  // Permission checks
  const userPermissions = getUserPermissions();
  const canCreateVendor = hasPermission(userPermissions, 'vendors', 'create');
  const canReadVendor = hasPermission(userPermissions, 'vendors', 'read');
  const canUpdateVendor = hasPermission(userPermissions, 'vendors', 'update');
  const canDeleteVendor = hasPermission(userPermissions, 'vendors', 'delete');
  const canImportVendorCSV = hasPermission(userPermissions, 'vendors', 'import_csv');
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    company_name: "",
    gst_treatment: "",
    source_of_supply: "",
    gst: "",
    currency_id: "",
    mode_of_payment: "",
    amount: "",
    quantity: "",
    document_path: "",
    created_date: new Date().toISOString().split('T')[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocument, setViewerDocument] = useState({ path: '', title: '' });
  const [formLoading, setFormLoading] = useState(false);
  
  // Sorting state
  const [sortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchVendors();
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/currencies`);
      const result = await response.json();
      
      if (result.success) {
        setCurrencies(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/vendors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch vendors');
      }

      setVendors(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const url = editingVendor 
        ? `${getApiBaseUrl()}/vendors/${editingVendor.id}`
        : `${getApiBaseUrl()}/vendors`;
      
      const method = editingVendor ? 'PUT' : 'POST';

      let response;

      // If file is selected, use FormData for multipart upload
      if (selectedFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name.trim());
        formDataToSend.append('contact_person', formData.contact_person.trim());
        formDataToSend.append('email', formData.email.trim());
        formDataToSend.append('phone', formData.phone.trim());
        formDataToSend.append('address', formData.address.trim());
        formDataToSend.append('company_name', formData.company_name.trim());
        formDataToSend.append('gst_treatment', formData.gst_treatment.trim());
        formDataToSend.append('source_of_supply', formData.source_of_supply.trim());
        formDataToSend.append('gst', formData.gst.trim());
        if (formData.currency_id) formDataToSend.append('currency_id', formData.currency_id);
        if (formData.mode_of_payment) formDataToSend.append('mode_of_payment', formData.mode_of_payment.trim());
        if (formData.amount) formDataToSend.append('amount', formData.amount);
        if (formData.quantity) formDataToSend.append('quantity', formData.quantity);
        formDataToSend.append('document', selectedFile);

        response = await fetch(url, {
          method,
          body: formDataToSend,
        });
      } else {
        // No file selected, use JSON
        const vendorData = {
          name: formData.name.trim(),
          contact_person: formData.contact_person.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          company_name: formData.company_name.trim(),
          gst_treatment: formData.gst_treatment.trim(),
          source_of_supply: formData.source_of_supply.trim(),
          gst: formData.gst.trim(),
          currency_id: formData.currency_id || null,
          mode_of_payment: formData.mode_of_payment.trim(),
          amount: formData.amount ? parseFloat(formData.amount) : null,
          quantity: formData.quantity ? parseInt(formData.quantity, 10) : null,
        };

        response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vendorData),
        });
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save vendor');
      }

      await fetchVendors();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    if (!canUpdateVendor) {
      setError("You don't have permission to edit vendors");
      return;
    }
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contact_person: vendor.contact_person || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      address: vendor.address || "",
      company_name: vendor.company_name || "",
      gst_treatment: vendor.gst_treatment || "",
      source_of_supply: vendor.source_of_supply || "",
      gst: vendor.gst || "",
      currency_id: vendor.currency_id || "",
      mode_of_payment: vendor.mode_of_payment || "",
      amount: vendor.amount?.toString() || "",
      quantity: vendor.quantity?.toString() || "",
      document_path: vendor.document_path || "",
      created_date: vendor.created_at ? new Date(vendor.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (vendorId: string) => {
    if (!canDeleteVendor) {
      setError("You don't have permission to delete vendors");
      return;
    }
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/vendors/${vendorId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error || "Failed to delete vendor");

      await fetchVendors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vendor");
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      contact_person: "", 
      email: "", 
      phone: "", 
      address: "", 
      company_name: "",
      gst_treatment: "",
      source_of_supply: "",
      gst: "",
      currency_id: "",
      mode_of_payment: "",
      amount: "",
      document_path: "",
      quantity: "",
      created_date: new Date().toISOString().split('T')[0],
    });
    setSelectedFile(null);
    setEditingVendor(null);
    setIsFormOpen(false);
  };

  const filteredVendors = vendors.filter(
    (vendor) => {
      const search = searchTerm.toLowerCase().trim();
      if (!search) return true;
      
      return (
        (vendor.name?.toLowerCase().trim() || '').includes(search) ||
        (vendor.contact_person?.toLowerCase().trim() || '').includes(search) ||
        (vendor.email?.toLowerCase().trim() || '').includes(search) ||
        (vendor.phone?.trim() || '').includes(search) ||
        (vendor.company_name?.toLowerCase().trim() || '').includes(search) ||
        (vendor.gst?.toLowerCase().trim() || '').includes(search)
      );
    }
  );

  // Sort vendors by created_at (oldest first)
  const sortedVendors = useMemo(() => {
    return [...filteredVendors].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredVendors, sortOrder]);

  return (
    <div className="space-y-4 mt-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vendors</h1>
        {(canCreateVendor || canImportVendorCSV) && (
          <div className="flex items-center gap-2">
            {canCreateVendor && (
              <button
                onClick={() => {
                  setEditingVendor(null);
                  setFormData({
                    name: "",
                    contact_person: "",
                    email: "",
                    phone: "",
                    address: "",
                    company_name: "",
                    gst_treatment: "",
                    source_of_supply: "",
                    gst: "",
                    currency_id: "",
                    mode_of_payment: "",
                    amount: "",
                    quantity: "",
                    document_path: "",
                    created_date: new Date().toISOString().split('T')[0],
                  });
                  setSelectedFile(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
              >
                <Plus className="h-4 w-4 mr-2.5" />
                Add New Vendor
              </button>
            )}
            {canImportVendorCSV && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center bg-green-600 dark:bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
              >
                <Upload className="h-4 w-4 mr-2.5" />
                Import CSV
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-dark-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                {editingVendor ? "Edit Vendor" : "Add New Vendor"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {editingVendor ? "Update vendor information" : "Fill in the details to add a new vendor"}
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-2 hover:bg-white/50 dark:hover:bg-dark-700/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* All Information in One Section */}
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-5 border border-gray-200 dark:border-dark-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Vendor Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      required
                      placeholder="Enter vendor name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Person
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="contact_person"
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="Contact person name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="Vendor@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="company_name"
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="Display name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="gst_treatment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GST Treatment
                  </label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      id="gst_treatment"
                      value={formData.gst_treatment}
                      onChange={(e) => setFormData({ ...formData, gst_treatment: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors appearance-none"
                    >
                      <option value="">Select GST Treatment</option>
                      <option value="Registered Business - Regular">Registered Business - Regular</option>
                      <option value="Registered Business - Composition">Registered Business - Composition</option>
                      <option value="Unregistered Business">Unregistered Business</option>
                      <option value="Overseas">Overseas</option>
                      <option value="Special Economic Zone">Special Economic Zone</option>
                      <option value="Deemed Export">Deemed Export</option>
                      <option value="Tax Deductor">Tax Deductor</option>
                      <option value="SEZ Developer">SEZ Developer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="source_of_supply" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source of Supply
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="source_of_supply"
                      type="text"
                      value={formData.source_of_supply}
                      onChange={(e) => setFormData({ ...formData, source_of_supply: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                      placeholder="State/Country of supply"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="gst" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GST Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="gst"
                      type="text"
                      value={formData.gst}
                      onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors uppercase"
                      placeholder="GST NUMBER (15 DIGITS)"
                      maxLength={15}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="currency_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency {formData.currency_id && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400 font-bold">
                        ({currencies.find(c => c.id === formData.currency_id)?.symbol})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      id="currency_id"
                      value={formData.currency_id}
                      onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                    >
                      <option value="">Select Currency</option>
                      {currencies.map((currency) => (
                        <option key={currency.id} value={currency.id}>
                          {currency.symbol} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="created_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Created Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="created_date"
                      type="date"
                      value={formData.created_date}
                      onChange={(e) => setFormData({ ...formData, created_date: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="document" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Document
                  </label>
                  <div className="relative">
                    <input
                      id="document"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('File size should be less than 5MB');
                            e.target.value = '';
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                  {formData.document_path && !selectedFile && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Document uploaded
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm transition-colors resize-none"
                      rows={3}
                      placeholder="Complete address with city, state, and postal code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600 font-medium transition-colors text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {formLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {editingVendor ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    {editingVendor ? "Update Vendor" : "Add Vendor"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Vendors by name, contact person, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4 text-gray-600" />
                    Sr No
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Vendor Name
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-purple-600" />
                    Contact Person
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-green-600" />
                    Email
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-orange-600" />
                    Phone
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    Display Name
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Receipt className="h-4 w-4 text-yellow-600" />
                    GST Treatment
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4 text-pink-600" />
                    GST Number
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    Source of Supply
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    Currency
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-cyan-600" />
                    Created Date
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-red-600" />
                    Address
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-dark-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {loading ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-3"></div>
                      <span className="text-sm font-medium">Loading Vendors...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedVendors.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center">
                      <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-sm font-medium">
                        {searchTerm
                          ? "No Vendors found matching your search"
                          : "No Vendors added yet"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {!searchTerm && "Click 'Add New Vendor' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedVendors.map((vendor, index) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-dark-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/vendors/${vendor.id}`)}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer text-left"
                      >
                        {vendor.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.contact_person && vendor.contact_person.trim() !== '' ? vendor.contact_person : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.email && vendor.email.trim() !== '' ? vendor.email : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.phone && vendor.phone.trim() !== '' ? vendor.phone : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.company_name && vendor.company_name.trim() !== '' ? vendor.company_name : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.gst_treatment && vendor.gst_treatment.trim() !== '' ? vendor.gst_treatment : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {vendor.gst && vendor.gst.trim() !== '' ? vendor.gst : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.source_of_supply && vendor.source_of_supply.trim() !== '' ? vendor.source_of_supply : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.currency_id ? (
                        (() => {
                          const currency = currencies.find(c => String(c.id) === String(vendor.currency_id));
                          return currency ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                              {currency.code} ({currency.symbol})
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          );
                        })()
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {vendor.created_at ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(vendor.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={vendor.address}>
                      {vendor.address && vendor.address.trim() !== '' ? vendor.address : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 sticky right-0 bg-white dark:bg-dark-800">
                      <div className="flex gap-2">
                        {vendor.document_path && vendor.document_path.trim() !== '' && (
                          <button
                            onClick={() => {
                              setViewerDocument({ 
                                path: vendor.document_path, 
                                title: `${vendor.name} - Document` 
                              });
                              setViewerOpen(true);
                            }}
                            className="p-2 mx-1 text-green-600 dark:text-green-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-500 rounded-lg transition-all shadow-sm hover:shadow-md"
                            aria-label="View document"
                            title="View Document"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {canUpdateVendor && (
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors"
                            aria-label="Edit Vendor"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteVendor && (
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-500 rounded-lg transition-colors"
                            aria-label="Delete Vendor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SimpleDocumentViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        documentPath={viewerDocument.path}
        title={viewerDocument.title}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Vendors"
        templateUrl={`${getApiBaseUrl()}/vendors/import-template`}
        importUrl={`${getApiBaseUrl()}/vendors/import`}
        onSuccess={() => {
          fetchVendors();
        }}
      />
    </div>
  );
}

export default Vendors;
