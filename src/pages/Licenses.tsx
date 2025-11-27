import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Upload, ArrowUpDown, ChevronLeft, ChevronRight, X, Calendar, IndianRupee, Tag, Building, Users, User, Eye, Edit, Printer } from 'lucide-react';
import MultiStepLicenseForm from '../components/MultiStepLicenseForm';
import SellLicenseForm from '../components/SellLicenseForm';
import ManageLicenseModal from '../components/ManageLicenseModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import PrintInvoiceModal from '../components/PrintInvoiceModal';
import CSVImportModal from '../components/CSVImportModal';
import { differenceInDays, format, parseISO } from 'date-fns';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { getApiBaseUrl } from '../utils/api';
import { getSession } from '../utils/session';
import { hasPermission, PERMISSIONS } from '../utils/accessControl';
import { getUserPermissions, hasPermission as checkPermission } from '../utils/permissionHelper';

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
  purchased_quantity: number;
  total_cost: number;
  total_cost_inr: number;
  currency_code?: string; // Currency used for cost_per_user
  purchase_date: string;
  expiration_date: string;
  client_name?: string; // Client name from API join
  client?: {
    name: string;
  };
}

interface Sale {
  id: string;
  user_id: string;
  client_id: string;
  purchase_id: string;
  tool_name: string;
  vendor: string;
  invoice_no: string;
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
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_email?: string;
  client_company?: string;
  make?: string;
  model?: string;
  version?: string;
  cost_per_unit?: number;
}

interface Client {
  id: string;
  name: string;
  currency_id: string;
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  exchange_rate_to_inr: string;
}

interface FilterState {
  vendors: string[];
  status: string[];
  priceRange: {
    min: number;
    max: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

type SortField = keyof LicensePurchase;
type SortOrder = 'asc' | 'desc';

function Licenses() {
  const location = useLocation();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<LicensePurchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  // Tab state for Purchase/Selling sections - will be set based on permissions in useEffect
  const [activeTab, setActiveTab] = useState<'purchase' | 'selling'>('purchase');
  
  // Access control - Get user permissions
  const userPermissions = getUserPermissions();
  const canManageAllLicenses = hasPermission(userSession?.role, PERMISSIONS.MANAGE_ALL_LICENSES);
  const canViewTeamLicenses = hasPermission(userSession?.role, PERMISSIONS.VIEW_TEAM_LICENSES);
  const canUpdateLicense = hasPermission(userSession?.role, PERMISSIONS.UPDATE_LICENSE);
  const canDeleteLicense = hasPermission(userSession?.role, PERMISSIONS.DELETE_LICENSE);
  
  // Module-level permissions for Purchase and Selling tabs
  const hasPurchaseLicensesAccess = checkPermission(userPermissions, 'purchase_licenses');
  const hasSellingLicensesAccess = checkPermission(userPermissions, 'selling_licenses');
  
  // New granular permissions for legacy licenses module
  const canAddPurchaseLicense = checkPermission(userPermissions, 'licenses', 'add_purchase_license') || checkPermission(userPermissions, 'purchase_licenses', 'add');
  const canAddSellLicense = checkPermission(userPermissions, 'licenses', 'add_sell_license') || checkPermission(userPermissions, 'selling_licenses', 'add');
  const canImportPurchaseLicenseCSV = checkPermission(userPermissions, 'purchase_licenses', 'import_csv');
  const canImportSellingLicenseCSV = checkPermission(userPermissions, 'selling_licenses', 'import_csv');
  const canCreateLicense = checkPermission(userPermissions, 'licenses', 'create');
  const canReadLicense = checkPermission(userPermissions, 'licenses', 'read');
  const canModifyLicense = checkPermission(userPermissions, 'licenses', 'update');
  const canRemoveLicense = checkPermission(userPermissions, 'licenses', 'delete');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printType, setPrintType] = useState<'purchase' | 'sale'>('purchase');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Sorting state (for Purchase tab)
  const [sortField, setSortField] = useState<SortField>('invoice_no');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selling tab states
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesSortField, setSalesSortField] = useState<keyof Sale>('invoice_no');
  const [salesSortOrder, setSalesSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isSalesFilterOpen, setIsSalesFilterOpen] = useState(false);
  const [isMarginFilterCustomized, setIsMarginFilterCustomized] = useState(false);
  const [salesFilters, setSalesFilters] = useState({
    vendors: [] as string[],
    clients: [] as string[],
    marginRange: {
      min: 0,
      max: Number.MAX_SAFE_INTEGER
    },
    saleDateRange: {
      start: '',
      end: ''
    }
  });

  // Filter state (for Purchase tab)
  const [filters, setFilters] = useState<FilterState>({
    vendors: [],
    status: [],
    priceRange: {
      min: 0,
      max: 0
    },
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Derived state (for Purchase tab)
  const uniqueVendors = useMemo(() => {
    const vendors = new Set(purchases.map(p => p.vendor).filter(Boolean));
    return Array.from(vendors).sort();
  }, [purchases]);

  const maxPrice = useMemo(() => {
    if (purchases.length === 0) return 0;
    return Math.max(...purchases.map(p => p.total_cost_inr || parseFloat(String((p as any).total_cost || 0))));
  }, [purchases]);

  // Derived state (for Selling tab)
  const uniqueSalesVendors = useMemo(() => {
    const vendors = new Set(sales.map(s => s.vendor).filter(Boolean));
    return Array.from(vendors).sort();
  }, [sales]);

  const uniqueClients = useMemo(() => {
    const clients = new Set(sales.map(s => s.client_name).filter(Boolean));
    return Array.from(clients).sort();
  }, [sales]);

  const maxMargin = useMemo(() => {
    if (sales.length === 0) return 0;
    return Math.max(...sales.map(s => s.margin || 0));
  }, [sales]);


  const fetchLicensePurchases = async () => {
    try {
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
      
      const data = result.data || [];
      setPurchases(data);

      // Initialize price range filter with actual data
      if (data && data.length > 0) {
        const prices = data.map((p: any) => p.total_cost_inr || 0);
        setFilters(prev => ({
          ...prev,
          priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices)
          }
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch licenses');
    } finally {
      setLoading(false);
    }
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
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/currencies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrencies(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
    }
  };

  const fetchSales = async () => {
    try {
      setSalesLoading(true);
      setSalesError(null);
      const response = await fetch(`${getApiBaseUrl()}/sales`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sales');
      }
      
      const data = result.data || [];
      setSales(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sales';
      setSalesError(errorMessage);
      console.error('Error fetching sales:', err);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    // Get user session for role-based UI
    const session = getSession();
    setUserSession(session);
    fetchLicensePurchases();
    fetchSales();
    fetchClients();
    fetchCurrencies();
  }, []);

  // Set default active tab based on permissions
  useEffect(() => {
    if (!hasPurchaseLicensesAccess && hasSellingLicensesAccess) {
      // If user only has selling access, default to selling tab
      setActiveTab('selling');
    } else if (hasPurchaseLicensesAccess) {
      // If user has purchase access, default to purchase tab
      setActiveTab('purchase');
    }
  }, [hasPurchaseLicensesAccess, hasSellingLicensesAccess]);

  // Helper function to get client currency and convert INR to client currency
  const getClientCurrencyData = (clientId: string) => {
    const client = clients.find(c => String(c.id) === String(clientId));
    if (!client) return null;
    
    const currency = currencies.find(c => String(c.id) === String(client.currency_id));
    if (!currency) return null;
    
    return {
      currency,
      convertFromINR: (inrAmount: number) => {
        // Convert INR to client currency using exchange rate
        // exchange_rate_to_inr tells us how many INR = 1 unit of foreign currency
        // So to convert FROM INR, we divide by the exchange rate
        const exchangeRate = parseFloat(currency.exchange_rate_to_inr) || 1;
        if (exchangeRate === 0) return 0;
        
        return inrAmount / exchangeRate;
      }
    };
  };

  const handleManage = (purchaseId: string) => {
    if (!canModifyLicense) {
      alert("You don't have permission to manage licenses");
      return;
    }
    setSelectedPurchaseId(purchaseId);
    setIsManageModalOpen(true);
  };

  const handleViewDocuments = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    setIsDocumentViewerOpen(true);
  };

  const handlePrint = (licenseId: string, type: 'purchase' | 'sale') => {
    setSelectedPurchaseId(licenseId);
    setPrintType(type);
    setIsPrintModalOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSalesSort = (field: keyof Sale) => {
    if (salesSortField === field) {
      setSalesSortOrder(salesSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSalesSortField(field);
      setSalesSortOrder('asc');
    }
  };

  const getLicenseStatus = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = differenceInDays(expDate, today);

    if (daysUntilExpiration < 0) {
      return 'expired';
    } else if (daysUntilExpiration <= 30) {
      return 'expiring-soon';
    }
    return 'active';
  };

  const applyFilters = (data: LicensePurchase[]) => {
    return data.filter(purchase => {
      // Search term filter with null safety
      const searchMatch = 
        (purchase.tool_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (purchase.make?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (purchase.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (purchase.vendor?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      if (!searchMatch && searchTerm) return false;

      // Vendor filter
      if (filters.vendors.length > 0 && purchase.vendor && !filters.vendors.includes(purchase.vendor)) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        const expirationDate = purchase.expiration_date || (purchase as any).expiry_date;
        if (expirationDate) {
          const status = getLicenseStatus(expirationDate);
          if (!filters.status.includes(status)) {
            return false;
          }
        }
      }

      // Price range filter
      const totalCost = purchase.total_cost_inr || parseFloat(String((purchase as any).total_cost || 0));
      if (totalCost < filters.priceRange.min || 
          totalCost > filters.priceRange.max) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const purchaseDate = new Date(purchase.purchase_date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (purchaseDate < startDate || purchaseDate > endDate) {
          return false;
        }
      }

      return true;
    });
  };

  const sortData = (data: LicensePurchase[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Special handling for invoice_no: extract numeric part and compare
      if (sortField === 'invoice_no' && typeof aValue === 'string' && typeof bValue === 'string') {
        const aNum = parseInt(aValue.replace(/\D/g, '') || '0');
        const bNum = parseInt(bValue.replace(/\D/g, '') || '0');
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });
  };

  const filteredPurchases = useMemo(() => applyFilters(purchases), [purchases, searchTerm, filters]);
  const sortedPurchases = useMemo(() => sortData(filteredPurchases), [filteredPurchases, sortField, sortOrder]);

  // Sales filtering and sorting
  const applySalesFilters = (data: Sale[]) => {
    return data.filter(sale => {
      // Search term filter
      const searchMatch = 
        (sale.tool_name?.toLowerCase() || '').includes(salesSearchTerm.toLowerCase()) ||
        (sale.make?.toLowerCase() || '').includes(salesSearchTerm.toLowerCase()) ||
        (sale.model?.toLowerCase() || '').includes(salesSearchTerm.toLowerCase()) ||
        (sale.vendor?.toLowerCase() || '').includes(salesSearchTerm.toLowerCase()) ||
        (sale.client_name?.toLowerCase() || '').includes(salesSearchTerm.toLowerCase()) ||
        (sale.invoice_no?.toLowerCase() || '').includes(salesSearchTerm.toLowerCase());

      if (!searchMatch && salesSearchTerm) return false;
      
      // Vendor filter
      if (salesFilters.vendors.length > 0 && sale.vendor && !salesFilters.vendors.includes(sale.vendor)) {
        return false;
      }

      // Client filter
      if (salesFilters.clients.length > 0 && sale.client_name && !salesFilters.clients.includes(sale.client_name)) {
        return false;
      }

      // Margin range filter (only apply if user has set custom range)
      if (salesFilters.marginRange.max < Number.MAX_SAFE_INTEGER || salesFilters.marginRange.min > 0) {
        if (sale.margin < salesFilters.marginRange.min || 
            sale.margin > salesFilters.marginRange.max) {
          return false;
        }
      }

      // Sale date range filter
      if (salesFilters.saleDateRange.start && salesFilters.saleDateRange.end) {
        const saleDate = new Date(sale.sale_date);
        const startDate = new Date(salesFilters.saleDateRange.start);
        const endDate = new Date(salesFilters.saleDateRange.end);
        if (saleDate < startDate || saleDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  };

  const sortSalesData = (data: Sale[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[salesSortField];
      const bValue = b[salesSortField];
      
      // Special handling for invoice_no: extract numeric part and compare
      if (salesSortField === 'invoice_no' && typeof aValue === 'string' && typeof bValue === 'string') {
        const aNum = parseInt(aValue.replace(/\D/g, '') || '0');
        const bNum = parseInt(bValue.replace(/\D/g, '') || '0');
        return salesSortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return salesSortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return salesSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  };

  const filteredSales = useMemo(() => applySalesFilters(sales), [sales, salesSearchTerm, salesFilters]);
  const sortedSales = useMemo(() => sortSalesData(filteredSales), [filteredSales, salesSortField, salesSortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedPurchases.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedPurchases.slice(indexOfFirstItem, indexOfLastItem);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-white" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="h-4 w-4 ml-1 text-white" /> : 
      <ArrowUpDown className="h-4 w-4 ml-1 text-white transform rotate-180" />;
  };

  const renderTableHeader = (field: SortField, label: string) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 whitespace-nowrap transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {renderSortIcon(field)}
      </div>
    </th>
  );

  const renderSalesSortIcon = (field: keyof Sale) => {
    if (salesSortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-white" />;
    }
    return salesSortOrder === 'asc' ? 
      <ArrowUpDown className="h-4 w-4 ml-1 text-white" /> : 
      <ArrowUpDown className="h-4 w-4 ml-1 text-white transform rotate-180" />;
  };

  const renderSalesTableHeader = (field: keyof Sale, label: string) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 whitespace-nowrap transition-colors"
      onClick={() => handleSalesSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {renderSalesSortIcon(field)}
      </div>
    </th>
  );

  const getRowClassName = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-gray-100 dark:bg-dark-700 opacity-60';
      case 'expiring-soon':
        return 'hover:bg-gray-50 dark:hover:bg-dark-700';
      default:
        return 'hover:bg-gray-50 dark:hover:bg-dark-700';
    }
  };

  const getExpirationText = (expirationDate: string) => {
    if (!expirationDate) {
      return 'N/A';
    }
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = differenceInDays(expDate, today);

    if (daysUntilExpiration < 0) {
      const daysExpired = Math.abs(daysUntilExpiration);
      return `Expired ${daysExpired} days ago`;
    } else if (daysUntilExpiration <= 30) {
      return `Expires in ${daysUntilExpiration} days`;
    }
    return format(parseISO(expirationDate), 'MMM d, yyyy');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.vendors.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.dateRange.start && filters.dateRange.end) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < maxPrice) count++;
    return count;
  };

  const clearFilters = () => {
    setFilters({
      vendors: [],
      status: [],
      priceRange: {
        min: 0,
        max: maxPrice
      },
      dateRange: {
        start: '',
        end: ''
      }
    });
  };

  const clearSalesFilters = () => {
    setIsMarginFilterCustomized(false);
    setSalesFilters({
      vendors: [],
      clients: [],
      marginRange: {
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      saleDateRange: {
        start: '',
        end: ''
      }
    });
  };

  const getActiveSalesFiltersCount = () => {
    let count = 0;
    if (salesFilters.vendors.length > 0) count++;
    if (salesFilters.clients.length > 0) count++;
    // Only count margin filter if it diverges from default (MAX_SAFE_INTEGER)
    if (salesFilters.marginRange.min > 0 || salesFilters.marginRange.max < Number.MAX_SAFE_INTEGER) count++;
    if (salesFilters.saleDateRange.start && salesFilters.saleDateRange.end) count++;
    return count;
  };

  return (
  <div className="space-y-6 mt-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Licenses</h1>
          <div className="flex gap-2">
            {canManageAllLicenses ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                <Users className="h-4 w-4 mr-1" />
                All Licenses (Admin)
              </span>
            ) : canViewTeamLicenses ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                <Users className="h-4 w-4 mr-1" />
                Team Licenses (Scrum Master)
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                <User className="h-4 w-4 mr-1" />
                My Licenses (Member)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for Purchase and Selling Licenses */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-dark-600">
          <nav className="flex -mb-px">
            {hasPurchaseLicensesAccess && (
              <button
                onClick={() => {
                  setActiveTab('purchase');
                  setCurrentPage(1);
                }}
                className={`${hasSellingLicensesAccess ? 'flex-1' : 'w-full'} py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'purchase'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Building className="h-5 w-5" />
                  <span>Purchase Licenses</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'purchase' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400'
                  }`}>
                    {purchases.length}
                  </span>
                </div>
              </button>
            )}
            {hasSellingLicensesAccess && (
              <button
                onClick={() => {
                  setActiveTab('selling');
                  setCurrentPage(1);
                }}
                className={`${hasPurchaseLicensesAccess ? 'flex-1' : 'w-full'} py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'selling'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Tag className="h-5 w-5" />
                  <span>Selling Licenses</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'selling' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400'
                  }`}>
                    {sales.length}
                  </span>
                </div>
              </button>
            )}
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-dark-600">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeTab === 'purchase' ? 'Purchase Licenses' : 'Selling Licenses'}
            </h2>
            <div className="flex items-center gap-2">
              {activeTab === 'purchase' && canAddPurchaseLicense && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Purchase License
                </button>
              )}
              {activeTab === 'purchase' && canImportPurchaseLicenseCSV && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </button>
              )}
              {activeTab === 'selling' && canAddSellLicense && (
                <button
                  onClick={() => setIsSellModalOpen(true)}
                  className="flex items-center bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Selling License
                </button>
              )}
              {activeTab === 'selling' && canImportSellingLicenseCSV && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search licenses..."
                value={activeTab === 'purchase' ? searchTerm : salesSearchTerm}
                onChange={(e) => activeTab === 'purchase' ? setSearchTerm(e.target.value) : setSalesSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-colors"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <button 
              onClick={() => activeTab === 'purchase' ? setIsFilterOpen(!isFilterOpen) : setIsSalesFilterOpen(!isSalesFilterOpen)}
              className="flex items-center px-4 py-2 border dark:border-dark-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors relative"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
              {(activeTab === 'purchase' ? getActiveFiltersCount() : getActiveSalesFiltersCount()) > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeTab === 'purchase' ? getActiveFiltersCount() : getActiveSalesFiltersCount()}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="mt-4 p-4 border dark:border-dark-600 rounded-lg bg-gray-50 dark:bg-dark-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Vendor Filter */}
                <div>
                  <label htmlFor="vendor-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building className="h-4 w-4 inline-block mr-1" />
                    Vendor
                  </label>
                  <select
                    id="vendor-filter"
                    multiple
                    value={filters.vendors}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, vendors: values }));
                    }}
                    className="w-full rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    aria-label="Filter by vendor"
                  >
                    {uniqueVendors.map(vendor => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Tag className="h-4 w-4 inline-block mr-1" />
                    Status
                  </label>
                  <select
                    id="status-filter"
                    multiple
                    value={filters.status}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setFilters(prev => ({ ...prev, status: values }));
                    }}
                    className="w-full rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    aria-label="Filter by status"
                  >
                    <option value="active">Active</option>
                    <option value="expiring-soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <IndianRupee className="h-4 w-4 inline-block mr-1" />
                    Price Range (INR)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, min: Number(e.target.value) }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, max: Number(e.target.value) }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label htmlFor="purchase-date-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline-block mr-1" />
                    Purchase Date Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="purchase-date-start"
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                      aria-label="Start date"
                    />
                    <input
                      id="purchase-date-end"
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                      aria-label="End date"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.vendors.map(vendor => (
                    <span key={vendor} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {vendor}
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          vendors: prev.vendors.filter(v => v !== vendor)
                        }))}
                        className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                        aria-label={`Remove ${vendor} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {filters.status.map(status => (
                    <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {status}
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          status: prev.status.filter(s => s !== status)
                        }))}
                        className="ml-1 hover:text-green-600 dark:hover:text-green-400"
                        aria-label={`Remove ${status} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {(filters.dateRange.start && filters.dateRange.end) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      {`${format(new Date(filters.dateRange.start), 'MMM d, yyyy')} - ${format(new Date(filters.dateRange.end), 'MMM d, yyyy')}`}
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          dateRange: { start: '', end: '' }
                        }))}
                        className="ml-1 hover:text-purple-600 dark:hover:text-purple-400"
                        aria-label="Remove date range filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selling Licenses Filter Panel */}
          {isSalesFilterOpen && (
            <div className="mt-4 p-4 border dark:border-dark-600 rounded-lg bg-gray-50 dark:bg-dark-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Filters</h3>
                <button
                  onClick={clearSalesFilters}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Vendor Filter */}
                <div>
                  <label htmlFor="sales-vendor-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building className="h-4 w-4 inline-block mr-1" />
                    Vendor
                  </label>
                  <select
                    id="sales-vendor-filter"
                    multiple
                    value={salesFilters.vendors}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSalesFilters(prev => ({ ...prev, vendors: values }));
                    }}
                    className="w-full rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    aria-label="Filter by vendor"
                  >
                    {uniqueSalesVendors.map(vendor => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                  </select>
                </div>

                {/* Client Filter */}
                <div>
                  <label htmlFor="sales-client-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="h-4 w-4 inline-block mr-1" />
                    Client
                  </label>
                  <select
                    id="sales-client-filter"
                    multiple
                    value={salesFilters.clients}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSalesFilters(prev => ({ ...prev, clients: values }));
                    }}
                    className="w-full rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    aria-label="Filter by client"
                  >
                    {uniqueClients.map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>

                {/* Margin Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <IndianRupee className="h-4 w-4 inline-block mr-1" />
                    Profit Margin Range (INR)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={salesFilters.marginRange.min}
                      onChange={(e) => {
                        setIsMarginFilterCustomized(true);
                        setSalesFilters(prev => ({
                          ...prev,
                          marginRange: { ...prev.marginRange, min: Number(e.target.value) }
                        }));
                      }}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 px-2 py-1"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={salesFilters.marginRange.max}
                      onChange={(e) => {
                        setIsMarginFilterCustomized(true);
                        setSalesFilters(prev => ({
                          ...prev,
                          marginRange: { ...prev.marginRange, max: Number(e.target.value) }
                        }));
                      }}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 px-2 py-1"
                    />
                  </div>
                </div>

                {/* Sale Date Range Filter */}
                <div>
                  <label htmlFor="sale-date-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline-block mr-1" />
                    Sale Date Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="sale-date-start"
                      type="date"
                      value={salesFilters.saleDateRange.start}
                      onChange={(e) => setSalesFilters(prev => ({
                        ...prev,
                        saleDateRange: { ...prev.saleDateRange, start: e.target.value }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 px-2 py-1"
                      aria-label="Start date"
                    />
                    <input
                      id="sale-date-end"
                      type="date"
                      value={salesFilters.saleDateRange.end}
                      onChange={(e) => setSalesFilters(prev => ({
                        ...prev,
                        saleDateRange: { ...prev.saleDateRange, end: e.target.value }
                      }))}
                      className="w-1/2 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 px-2 py-1"
                      aria-label="End date"
                    />
                  </div>
                </div>
              </div>

              {/* Active Sales Filters */}
              {getActiveSalesFiltersCount() > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {salesFilters.vendors.map(vendor => (
                    <span key={vendor} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {vendor}
                      <button
                        onClick={() => setSalesFilters(prev => ({
                          ...prev,
                          vendors: prev.vendors.filter(v => v !== vendor)
                        }))}
                        className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                        aria-label={`Remove ${vendor} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {salesFilters.clients.map(client => (
                    <span key={client} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {client}
                      <button
                        onClick={() => setSalesFilters(prev => ({
                          ...prev,
                          clients: prev.clients.filter(c => c !== client)
                        }))}
                        className="ml-1 hover:text-green-600 dark:hover:text-green-400"
                        aria-label={`Remove ${client} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {(salesFilters.saleDateRange.start && salesFilters.saleDateRange.end) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      {`${format(new Date(salesFilters.saleDateRange.start), 'MMM d, yyyy')} - ${format(new Date(salesFilters.saleDateRange.end), 'MMM d, yyyy')}`}
                      <button
                        onClick={() => setSalesFilters(prev => ({
                          ...prev,
                          saleDateRange: { start: '', end: '' }
                        }))}
                        className="ml-1 hover:text-purple-600 dark:hover:text-purple-400"
                        aria-label="Remove date range filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* No Access Message */}
        {!hasPurchaseLicensesAccess && !hasSellingLicensesAccess && (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4 flex justify-center">
                <Building className="h-16 w-16 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No License Access
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You don't have permission to view license information. Please contact your administrator for access.
              </p>
            </div>
          </div>
        )}

        {/* Purchase Licenses Tab Content */}
        {activeTab === 'purchase' && hasPurchaseLicensesAccess && (
          <>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600">
                {/* First row - Main headers with grouped columns */}
                <tr>
                  <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                    Invoice No
                  </th>
                  <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                    Vendor
                  </th>
                  <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                    Item Name
                  </th>
                  <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                    Purchased Qty
                  </th>
                  <th rowSpan={2} className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                    Available Qty
                  </th>
                  <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                    Purchase Date
                  </th>
                  <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                    Expiration Date
                  </th>
                  <th colSpan={4} className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-x-2 border-white/30 bg-blue-600/30">
                    Purchase Details (INR)
                  </th>
                  <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-l border-white/20">
                    Actions
                  </th>
                </tr>
                {/* Second row - Sub-headers for grouped columns */}
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                    Per Unit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                    Subtotal
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                    GST (18%)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <span className="ml-2">Loading licenses...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No licenses found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((purchase, index) => {
                    const status = getLicenseStatus(purchase.expiration_date);
                    
                    // Calculate amounts properly: (Amount × Quantity) + GST
                    // Use cost_per_user if available, otherwise fall back to stored totals
                    const perUnitAmount = purchase.cost_per_user || 0;
                    const subtotal = purchase.cost_per_user 
                      ? (perUnitAmount * purchase.purchased_quantity)
                      : (purchase.total_cost_inr || purchase.total_cost || 0);
                    const gstAmount = subtotal * 0.18;
                    const totalWithGST = subtotal + gstAmount;
                    
                    return (
                      <tr key={purchase.id} className={getRowClassName(status)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-dark-600">
                          {purchase.invoice_no || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-dark-600">
                          {purchase.vendor || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-dark-600">
                          {purchase.tool_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-blue-600 dark:text-blue-400 border-r border-gray-200 dark:border-dark-600">
                          {purchase.purchased_quantity}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold border-r border-gray-200 dark:border-dark-600 ${
                          purchase.quantity === 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                          {purchase.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-dark-600">
                          {purchase.purchase_date ? format(parseISO(purchase.purchase_date), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm border-r border-gray-200 dark:border-dark-600 ${
                          status === 'expired' ? 'text-gray-500 dark:text-gray-400' :
                          status === 'expiring-soon' ? 'text-red-600 dark:text-red-400 font-medium' :
                          'text-gray-500 dark:text-gray-400'
                        }`}>
                          {getExpirationText(purchase.expiration_date)}
                        </td>
                        
                        {/* Purchase Details (INR) Section */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-x border-gray-200 dark:border-dark-600 bg-blue-50/30 dark:bg-blue-900/10">
                          {formatCurrencyUtil(perUnitAmount, 'INR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium border-x border-gray-200 dark:border-dark-600 bg-blue-50/30 dark:bg-blue-900/10">
                          {formatCurrencyUtil(subtotal, 'INR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 border-x border-gray-200 dark:border-dark-600 bg-blue-50/30 dark:bg-blue-900/10">
                          {formatCurrencyUtil(gstAmount, 'INR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 dark:text-blue-400 border-x border-gray-200 dark:border-dark-600 bg-blue-50/30 dark:bg-blue-900/10">
                          {formatCurrencyUtil(totalWithGST, 'INR')}
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-dark-600">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDocuments(purchase.id)}
                              className="p-2 mx-1 rounded-lg font-medium text-green-600 dark:text-green-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-500 transition-all shadow-sm hover:shadow-md"
                              aria-label={`View documents for ${purchase.tool_name}`}
                              title="View Documents"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handlePrint(purchase.id, 'purchase')}
                              className="p-2 rounded-lg font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-900 dark:hover:text-purple-300 transition-colors"
                              aria-label={`Print invoice for ${purchase.tool_name}`}
                              title="Print Invoice"
                            >
                              <Printer className="h-5 w-5" />
                            </button>
                            {canUpdateLicense && (
                              <button
                                onClick={() => handleManage(purchase.id)}
                                className="p-2 rounded-lg font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                                aria-label={`Manage license for ${purchase.tool_name}`}
                                title="Manage License"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800">
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, sortedPurchases.length)}
                      </span>{' '}
                      of <span className="font-medium">{sortedPurchases.length}</span> results
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Go to previous page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Go to next page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Selling Licenses Tab Content */}
        {activeTab === 'selling' && hasSellingLicensesAccess && (
          <>
            {salesError ? (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg m-4">
                {salesError}
              </div>
            ) : sortedSales.length === 0 && !salesLoading ? (
              <div className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="mb-4 flex justify-center">
                    <Tag className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {salesSearchTerm ? 'No sales found' : 'No Selling Licenses Yet'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {salesSearchTerm 
                      ? 'Try adjusting your search terms.'
                      : 'Start selling licenses to your clients. Your sales records will appear here.'}
                  </p>
                  {canAddSellLicense && !salesSearchTerm && (
                    <button
                      onClick={() => setIsSellModalOpen(true)}
                      className="inline-flex items-center bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Selling License
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                    <thead className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600">
                      {/* First row - Main headers with grouped columns */}
                      <tr>
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                          Invoice No
                        </th>
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                          Client
                        </th>
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                          Item Name
                        </th>
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                          Quantity
                        </th>
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                          Sale Date
                        </th>
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-white/20">
                          Expiry Date
                        </th>
                        <th colSpan={3} className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-x-2 border-white/30 bg-orange-600/30">
                          Purchase Details (INR)
                        </th>
                        <th colSpan={3} className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-x-2 border-white/30 bg-green-600/30">
                          Selling Details (INR)
                        </th>
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-x border-white/20">
                          Profit Margin
                        </th>
                        <th colSpan={3} className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-l-2 border-white/40 bg-purple-600/30">
                          Client Currency Conversion
                        </th>
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-l border-white/20">
                          Actions
                        </th>
                      </tr>
                      {/* Second row - Sub-headers for grouped columns */}
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                          GST (18%)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                          Total
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                          GST (18%)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10">
                          Total
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10 bg-purple-500/20">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10 bg-purple-500/20">
                          GST
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-white/90 uppercase tracking-wider border-x border-white/10 bg-purple-500/20">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                      {salesLoading ? (
                        <tr>
                          <td colSpan={17} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                              <span className="ml-2">Loading sales...</span>
                            </div>
                          </td>
                        </tr>
                      ) : sortedSales.length === 0 ? (
                        <tr>
                          <td colSpan={17} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            No sales found
                          </td>
                        </tr>
                      ) : (
                        sortedSales.map((sale, index) => {
                          // Get client currency data for conversion
                          const clientCurrencyData = getClientCurrencyData(sale.client_id);
                          
                          return (
                            <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-dark-600">
                                {sale.invoice_no || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-dark-600">
                                {sale.vendor || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-dark-600">
                                {sale.tool_name}
                                {(sale.make || sale.model || sale.version) && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {[sale.make, sale.model, sale.version].filter(Boolean).join(' / ')}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-dark-600">
                                {sale.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-dark-600">
                                {sale.sale_date ? format(parseISO(sale.sale_date), 'MMM d, yyyy') : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-dark-600">
                                {sale.expiry_date ? format(parseISO(sale.expiry_date), 'MMM d, yyyy') : 'N/A'}
                              </td>
                              
                              {/* Purchase Details (INR) Section */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium border-x border-gray-200 dark:border-dark-600 bg-orange-50/30 dark:bg-orange-900/10">
                                {formatCurrencyUtil(sale.purchase_amount, 'INR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 border-x border-gray-200 dark:border-dark-600 bg-orange-50/30 dark:bg-orange-900/10">
                                {formatCurrencyUtil(sale.purchase_gst, 'INR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 dark:text-orange-400 font-semibold border-x border-gray-200 dark:border-dark-600 bg-orange-50/30 dark:bg-orange-900/10">
                                {formatCurrencyUtil(sale.total_purchase_cost, 'INR')}
                              </td>
                              
                              {/* Selling Details (INR) Section */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium border-x border-gray-200 dark:border-dark-600 bg-green-50/30 dark:bg-green-900/10">
                                {formatCurrencyUtil(sale.selling_amount, 'INR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 border-x border-gray-200 dark:border-dark-600 bg-green-50/30 dark:bg-green-900/10">
                                {formatCurrencyUtil(sale.selling_gst, 'INR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 dark:text-blue-400 border-x border-gray-200 dark:border-dark-600 bg-green-50/30 dark:bg-green-900/10">
                                {formatCurrencyUtil(sale.total_selling_price, 'INR')}
                              </td>
                              
                              {/* Profit Margin */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold border-x border-gray-200 dark:border-dark-600">
                                {formatCurrencyUtil((sale.selling_amount || 0) - (sale.purchase_amount || 0), 'INR')}
                              </td>
                              
                              {/* Client Currency Conversion Section */}
                              {clientCurrencyData ? (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400 font-medium border-l-2 border-r border-gray-300 dark:border-dark-500 bg-purple-50/30 dark:bg-purple-900/10">
                                    <div className="flex flex-col">
                                      <span>{formatCurrencyUtil(clientCurrencyData.convertFromINR(sale.selling_amount), clientCurrencyData.currency.code)}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{clientCurrencyData.currency.code}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400 border-x border-gray-200 dark:border-dark-600 bg-purple-50/30 dark:bg-purple-900/10">
                                    <div className="flex flex-col">
                                      <span>{formatCurrencyUtil(clientCurrencyData.convertFromINR(sale.selling_gst), clientCurrencyData.currency.code)}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{clientCurrencyData.currency.code}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700 dark:text-purple-300 font-semibold border-x border-gray-200 dark:border-dark-600 bg-purple-50/30 dark:bg-purple-900/10">
                                    <div className="flex flex-col">
                                      <span>{formatCurrencyUtil(clientCurrencyData.convertFromINR(sale.total_selling_price), clientCurrencyData.currency.code)}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{clientCurrencyData.currency.code}</span>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500 border-l-2 border-r border-gray-300 dark:border-dark-500 bg-purple-50/20 dark:bg-purple-900/5">
                                    <span className="text-xs">N/A</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500 border-x border-gray-200 dark:border-dark-600 bg-purple-50/20 dark:bg-purple-900/5">
                                    <span className="text-xs">N/A</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500 border-x border-gray-200 dark:border-dark-600 bg-purple-50/20 dark:bg-purple-900/5">
                                    <span className="text-xs">N/A</span>
                                  </td>
                                </>
                              )}
                              
                              {/* Actions */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-dark-600">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewDocuments(sale.purchase_id)}
                                    className="p-2 mx-1 rounded-lg font-medium text-green-600 dark:text-green-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-500 transition-all shadow-sm hover:shadow-md"
                                    aria-label={`View documents for ${sale.tool_name}`}
                                    title="View Documents"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handlePrint(sale.id, 'sale')}
                                    className="p-2 rounded-lg font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-900 dark:hover:text-purple-300 transition-colors"
                                    aria-label={`Print invoice for ${sale.tool_name}`}
                                    title="Print Invoice"
                                  >
                                    <Printer className="h-5 w-5" />
                                  </button>
                                  {canUpdateLicense && (
                                    <button
                                      onClick={() => handleManage(sale.purchase_id)}
                                      className="p-2 rounded-lg font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                                      aria-label={`Manage sale for ${sale.tool_name}`}
                                      title="Manage Sale"
                                    >
                                      <Edit className="h-5 w-5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <MultiStepLicenseForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchLicensePurchases}
      />

      <SellLicenseForm
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onSuccess={() => {
          setIsSellModalOpen(false);
          fetchLicensePurchases();
          fetchSales();
        }}
      />

      <ManageLicenseModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedPurchaseId(null);
        }}
        purchaseId={selectedPurchaseId || ''}
        onSuccess={fetchLicensePurchases}
      />

      <DocumentViewerModal
        isOpen={isDocumentViewerOpen}
        onClose={() => {
          setIsDocumentViewerOpen(false);
          setSelectedPurchaseId(null);
        }}
        purchaseId={selectedPurchaseId || ''}
      />

      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedPurchaseId(null);
        }}
        licenseId={selectedPurchaseId || ''}
        type={printType}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={activeTab === 'purchase' ? 'Import License Purchases' : 'Import Selling Licenses'}
        templateUrl={activeTab === 'purchase' 
          ? `${getApiBaseUrl()}/licenses/import-template`
          : `${getApiBaseUrl()}/sales/import-template`}
        importUrl={activeTab === 'purchase' 
          ? `${getApiBaseUrl()}/licenses/import`
          : `${getApiBaseUrl()}/sales/import`}
        onSuccess={() => {
          if (activeTab === 'purchase') {
            fetchLicensePurchases();
          } else {
            fetchSales();
          }
        }}
      />
    </div>
  );
}

export default Licenses;