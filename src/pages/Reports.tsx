import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { format, subMonths, differenceInDays, addMonths } from "date-fns";
import { api } from '../lib/api';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import { getApiBaseUrl } from '../utils/api';
import { getUserPermissions, hasPermission } from '../utils/permissionHelper';

const COLORS = [
  "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", 
  "#F43F5E", "#F97316", "#84CC16", "#14B8A6", "#06B6D4", "#94A3B8"
];

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
  currency_code?: string; // Currency used for cost_per_user
  purchase_date: string;
  expiration_date: string;
  client?: {
    name: string;
  };
}

interface MonthlyData {
  month: string;
  totalCost: number;
  totalCostINR: number;
  licenses: number;
  purchases: number;
}

interface VendorData {
  vendor: string;
  totalCost: number;
  totalCostINR: number;
  licenses: number;
}

interface RenewalData {
  expired: LicensePurchase[];
  expiringSoon: LicensePurchase[];
  active: LicensePurchase[];
  totalRenewalCostINR: number;
  totalRenewalCostUSD: number;
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
}

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalMargin: number;
  totalGstCollected: number;
  totalGstPaid: number;
  netGst: number;
  averageMargin: number;
  monthlySalesData: Array<{
    month: string;
    sales: number;
    revenue: number;
    profit: number;
  }>;
}

interface VendorSalesStats {
  vendor: string;
  totalRevenue: number;
  totalProfit: number;
  totalSales: number;
  averageMargin: number;
}

function Reports() {
  // Permission checks for tabs
  const permissions = getUserPermissions();
  const hasPurchaseAccess = hasPermission(permissions, 'purchase_licenses');
  const hasSellingAccess = hasPermission(permissions, 'selling_licenses');
  
  // Tab state - default to first available tab
  const getDefaultTab = (): 'purchase' | 'selling' => {
    if (hasPurchaseAccess) return 'purchase';
    if (hasSellingAccess) return 'selling';
    return 'purchase'; // Fallback
  };
  
  const [activeTab, setActiveTab] = useState<'purchase' | 'selling'>(getDefaultTab());
  const [purchases, setPurchases] = useState<LicensePurchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [vendorData, setVendorData] = useState<VendorData[]>([]);
  const [renewalData, setRenewalData] = useState<RenewalData>({
    expired: [],
    expiringSoon: [],
    active: [],
    totalRenewalCostINR: 0,
    totalRenewalCostUSD: 0,
  });
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalMargin: 0,
    totalGstCollected: 0,
    totalGstPaid: 0,
    netGst: 0,
    averageMargin: 0,
    monthlySalesData: [],
  });
  const [vendorSalesStats, setVendorSalesStats] = useState<VendorSalesStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"6m" | "1y">("6m");
  const [exportFullData, setExportFullData] = useState(false);

  // Helper function to determine correct currency and amount
  const getCostAndCurrency = (purchase: LicensePurchase) => {
    let amount = 0;
    let currency = purchase.currency_code || 'INR'; // Default to INR
    
    // Debug logging for cost calculation
    console.log(`Processing license ${purchase.id}:`, {
      currency_code: purchase.currency_code,
      total_cost: purchase.total_cost,
      total_cost_inr: purchase.total_cost_inr,
      cost_per_user: purchase.cost_per_user,
      quantity: purchase.quantity
    });
    
    // Priority order for determining cost:
    // 1. If total_cost_inr exists and > 0, use INR
    // 2. If total_cost exists and > 0, use USD (or specified currency)
    // 3. Calculate from cost_per_user * quantity
    
    if (purchase.total_cost_inr && purchase.total_cost_inr > 0) {
      amount = purchase.total_cost_inr;
      currency = 'INR';
    } else if (purchase.total_cost && purchase.total_cost > 0) {
      amount = purchase.total_cost;
      currency = purchase.currency_code || 'USD';
    } else {
      // Fallback: calculate from cost_per_user * quantity
      const costPerUser = purchase.cost_per_user || 0;
      const quantity = purchase.quantity || 1;
      amount = costPerUser * quantity;
      
      // If cost_per_user seems to be in INR (high values), assume INR
      if (costPerUser > 1000) {
        currency = 'INR';
      } else {
        currency = purchase.currency_code || 'USD';
      }
    }
    
    console.log(`Final calculation for ${purchase.id}:`, { amount, currency });
    return { amount, currency };
  };

  useEffect(() => {
    fetchLicensePurchases();
    fetchSalesData();
  }, []);

  useEffect(() => {
    if (purchases.length > 0) {
      processData();
      processRenewalData();
    }
  }, [purchases, timeRange]);

  useEffect(() => {
    if (sales.length > 0) {
      processSalesData();
    }
  }, [sales, timeRange]);

  const fetchLicensePurchases = async () => {
    try {
      setLoading(true);
      console.log('Fetching license purchases for reports...');
      
      // Get the proper API base URL for deployment
      const apiBaseUrl = getApiBaseUrl();
      const apiUrl = `${apiBaseUrl}/licenses`;
      
      console.log('Using API URL:', apiUrl);
      
      // Fetch license purchases directly from PHP backend API
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}. Check if ${apiUrl} exists.`);
      }

      const result = await response.json();
      console.log('Reports API response:', result);

      if (result.success && result.data && Array.isArray(result.data)) {
        console.log('Setting purchases for reports, count:', result.data.length);
        setPurchases(result.data);
      } else {
        console.warn('Invalid data format received for reports:', result);
        // If API doesn't return expected format, try the api client as fallback
        const { data, error } = await api.from("license_purchases").select();
        if (error) {
          throw error;
        }
        if (data && Array.isArray(data)) {
          console.log('Using fallback data, count:', data.length);
          setPurchases(data);
        } else {
          throw new Error('No valid license data available');
        }
      }
    } catch (err) {
      console.error('Error in fetchLicensePurchases:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch licenses for reports";
      setError(`${errorMessage}. Please check if the API endpoint is deployed correctly.`);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const processRenewalData = () => {
    const now = new Date();
    const thirtyDaysFromNow = addMonths(now, 1);

    console.log('Processing renewal data. Total purchases:', purchases.length);
    console.log('Current date:', now);
    console.log('Thirty days from now:', thirtyDaysFromNow);

    const expired: LicensePurchase[] = [];
    const expiringSoon: LicensePurchase[] = [];
    const active: LicensePurchase[] = [];
    let totalRenewalCostINR = 0;
    let totalRenewalCostUSD = 0;

    purchases.forEach((purchase) => {
      // Validate expiration date
      if (!purchase.expiration_date) {
        console.warn(`License ${purchase.tool_name} has no expiration date, skipping`);
        return;
      }
      
      const expirationDate = new Date(purchase.expiration_date);
      
      // Check if date is valid
      if (isNaN(expirationDate.getTime())) {
        console.warn(`License ${purchase.tool_name} has invalid expiration date: ${purchase.expiration_date}`);
        return;
      }
      
      console.log(`License ${purchase.tool_name}: expiration ${expirationDate}, current ${now}`);

      if (expirationDate < now) {
        expired.push(purchase);
        console.log(`Added to expired: ${purchase.tool_name}`);
      } else if (expirationDate <= thirtyDaysFromNow) {
        expiringSoon.push(purchase);
        console.log(`Added to expiring soon: ${purchase.tool_name}`);
        const { amount, currency } = getCostAndCurrency(purchase);
        if (currency === 'INR') {
          totalRenewalCostINR += amount;
        } else {
          totalRenewalCostUSD += amount;
        }
      } else {
        active.push(purchase);
        console.log(`Added to active: ${purchase.tool_name}`);
      }
    });

    console.log('Final counts:', {
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      active: active.length,
      totalRenewalCostINR,
      totalRenewalCostUSD
    });

    setRenewalData({
      expired: expired.sort(
        (a, b) =>
          new Date(b.expiration_date).getTime() -
          new Date(a.expiration_date).getTime(),
      ),
      expiringSoon: expiringSoon.sort(
        (a, b) =>
          new Date(a.expiration_date).getTime() -
          new Date(b.expiration_date).getTime(),
      ),
      active: active.sort(
        (a, b) =>
          new Date(a.expiration_date).getTime() -
          new Date(b.expiration_date).getTime(),
      ),
      totalRenewalCostINR,
      totalRenewalCostUSD,
    });
  };

  const processData = () => {
    console.log('Processing data for reports. Total purchases:', purchases.length);
    
    // Get date range
    const endDate = new Date();
    const startDate = subMonths(endDate, timeRange === "6m" ? 6 : 12);
    
    console.log('Date range:', { startDate, endDate, timeRange });

    // Process monthly data
    const monthlyMap = new Map<string, MonthlyData>();
    const vendorMap = new Map<string, VendorData>();

    purchases.forEach((purchase) => {
      // Validate purchase date
      if (!purchase.purchase_date) {
        console.warn(`License ${purchase.tool_name} has no purchase date, skipping`);
        return;
      }
      
      const purchaseDate = new Date(purchase.purchase_date);
      
      // Check if date is valid
      if (isNaN(purchaseDate.getTime())) {
        console.warn(`License ${purchase.tool_name} has invalid purchase date: ${purchase.purchase_date}`);
        return;
      }

      // Skip if outside date range
      if (purchaseDate < startDate || purchaseDate > endDate) {
        console.log(`Skipping ${purchase.tool_name} - outside date range`);
        return;
      }

      const { amount, currency } = getCostAndCurrency(purchase);
      
      console.log(`Processing ${purchase.tool_name}: amount=${amount}, currency=${currency}`);

      // Monthly data
      const monthKey = format(purchaseDate, "MMM yyyy");
      const monthData = monthlyMap.get(monthKey) || {
        month: monthKey,
        totalCost: 0,
        totalCostINR: 0,
        licenses: 0,
        purchases: 0,
      };

      // Add to appropriate currency field based on detected currency
      if (currency === 'INR') {
        monthData.totalCostINR += amount;
      } else {
        monthData.totalCost += amount;
      }
      monthData.licenses += purchase.quantity || 1;
      monthData.purchases += 1;
      monthlyMap.set(monthKey, monthData);

      // Vendor data
      const vendorKey = purchase.vendor || "Unknown";
      const vendorStats = vendorMap.get(vendorKey) || {
        vendor: vendorKey,
        totalCost: 0,
        totalCostINR: 0,
        licenses: 0,
      };

      // Add to appropriate currency field based on detected currency
      if (currency === 'INR') {
        vendorStats.totalCostINR += amount;
      } else {
        vendorStats.totalCost += amount;
      }
      vendorStats.licenses += purchase.quantity || 1;
      vendorMap.set(vendorKey, vendorStats);
    });

    // Convert maps to arrays and sort
    const monthlyArray = Array.from(monthlyMap.values()).sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
    );

    const vendorArray = Array.from(vendorMap.values()).sort(
      (a, b) => (b.totalCostINR + b.totalCost) - (a.totalCostINR + a.totalCost),
    );

    console.log('Processed data:', {
      monthlyCount: monthlyArray.length,
      vendorCount: vendorArray.length,
      monthlyData: monthlyArray,
      vendorData: vendorArray
    });

    setMonthlyData(monthlyArray);
    setVendorData(vendorArray);
  };

  const fetchSalesData = async () => {
    try {
      setSalesLoading(true);
      setSalesError(null);
      console.log('Fetching sales data for reports...');
      
      const apiBaseUrl = getApiBaseUrl();
      const apiUrl = `${apiBaseUrl}/sales`;
      
      console.log('Using Sales API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Sales API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Sales API response:', result);

      if (result.success && result.data && Array.isArray(result.data)) {
        console.log('Setting sales for reports, count:', result.data.length);
        setSales(result.data);
      } else {
        console.warn('Invalid sales data format received:', result);
        setSales([]);
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sales data';
      setSalesError(errorMessage);
      setSales([]);
    } finally {
      setSalesLoading(false);
    }
  };

  const processSalesData = () => {
    console.log('Processing sales data for reports. Total sales:', sales.length);
    
    const endDate = new Date();
    const startDate = subMonths(endDate, timeRange === "6m" ? 6 : 12);
    
    console.log('Sales date range:', { startDate, endDate, timeRange });

    const newSalesStats: SalesStats = {
      totalSales: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalMargin: 0,
      totalGstCollected: 0,
      totalGstPaid: 0,
      netGst: 0,
      averageMargin: 0,
      monthlySalesData: [],
    };

    const monthlyMap = new Map<string, { sales: number; revenue: number; profit: number }>();
    const vendorMap = new Map<string, VendorSalesStats>();

    sales.forEach((sale) => {
      if (!sale.sale_date) {
        console.warn(`Sale ${sale.id} has no sale date, skipping`);
        return;
      }
      
      const saleDate = new Date(sale.sale_date);
      
      if (isNaN(saleDate.getTime())) {
        console.warn(`Sale ${sale.id} has invalid sale date: ${sale.sale_date}`);
        return;
      }

      if (saleDate < startDate || saleDate > endDate) {
        console.log(`Skipping sale ${sale.id} - outside date range`);
        return;
      }

      const revenue = parseFloat(String(sale.total_selling_price || 0));
      const cost = parseFloat(String(sale.total_purchase_cost || 0));
      const profit = parseFloat(String(sale.margin || 0));
      const gstCollected = parseFloat(String(sale.selling_gst || 0));
      const gstPaid = parseFloat(String(sale.purchase_gst || 0));

      newSalesStats.totalSales += 1;
      newSalesStats.totalRevenue += revenue;
      newSalesStats.totalCost += cost;
      newSalesStats.totalProfit += profit;
      newSalesStats.totalGstCollected += gstCollected;
      newSalesStats.totalGstPaid += gstPaid;

      const monthKey = format(saleDate, "MMM yyyy");
      const monthData = monthlyMap.get(monthKey) || { sales: 0, revenue: 0, profit: 0 };
      monthData.sales += 1;
      monthData.revenue += revenue;
      monthData.profit += profit;
      monthlyMap.set(monthKey, monthData);

      const vendorName = sale.vendor || 'Unknown Vendor';
      const vendorStats = vendorMap.get(vendorName) || {
        vendor: vendorName,
        totalRevenue: 0,
        totalProfit: 0,
        totalSales: 0,
        averageMargin: 0,
      };
      vendorStats.totalRevenue += revenue;
      vendorStats.totalProfit += profit;
      vendorStats.totalSales += 1;
      vendorMap.set(vendorName, vendorStats);
    });

    newSalesStats.netGst = newSalesStats.totalGstCollected - newSalesStats.totalGstPaid;
    newSalesStats.averageMargin = newSalesStats.totalRevenue > 0 
      ? (newSalesStats.totalProfit / newSalesStats.totalRevenue) * 100 
      : 0;

    newSalesStats.monthlySalesData = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const vendorSalesArray = Array.from(vendorMap.values()).map(v => ({
      ...v,
      averageMargin: v.totalRevenue > 0 ? (v.totalProfit / v.totalRevenue) * 100 : 0,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    console.log('Processed sales data:', {
      totalSales: newSalesStats.totalSales,
      totalRevenue: newSalesStats.totalRevenue,
      totalProfit: newSalesStats.totalProfit,
      vendorCount: vendorSalesArray.length
    });

    setSalesStats(newSalesStats);
    setVendorSalesStats(vendorSalesArray);
  };

  const exportSalesData = () => {
    const sections = [];

    sections.push(
      "# Sales Summary Report",
      "Metric,Value",
      `Total Sales,${salesStats.totalSales}`,
      `Total Revenue,${salesStats.totalRevenue.toFixed(2)}`,
      `Total Cost,${salesStats.totalCost.toFixed(2)}`,
      `Total Profit,${salesStats.totalProfit.toFixed(2)}`,
      `Average Margin,${salesStats.averageMargin.toFixed(2)}%`,
      `Total GST Collected,${salesStats.totalGstCollected.toFixed(2)}`,
      `Total GST Paid,${salesStats.totalGstPaid.toFixed(2)}`,
      `Net GST,${salesStats.netGst.toFixed(2)}`,
    );

    sections.push(
      "",
      "# Monthly Sales Breakdown",
      "Month,Sales Count,Revenue (INR),Profit (INR)",
      ...salesStats.monthlySalesData.map((data) =>
        [
          data.month,
          data.sales,
          data.revenue.toFixed(2),
          data.profit.toFixed(2),
        ].join(","),
      ),
    );

    sections.push(
      "",
      "# Vendor Performance",
      "Vendor,Total Sales,Total Revenue (INR),Total Profit (INR),Average Margin (%)",
      ...vendorSalesStats.map((vendor) =>
        [
          `"${vendor.vendor}"`,
          vendor.totalSales,
          vendor.totalRevenue.toFixed(2),
          vendor.totalProfit.toFixed(2),
          vendor.averageMargin.toFixed(2),
        ].join(","),
      ),
    );

    const csvContent = sections.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const fileName = `sales-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const handleExport = () => {
    if (activeTab === 'selling') {
      exportSalesData();
    } else if (exportFullData) {
      // Keep existing full data export logic
      const headers = [
        "Tool Name",
        "Make",
        "Model",
        "Version",
        "Vendor",
        "Cost per User (INR)",
        "Cost per User (USD)",
        "Licenses",
        "Tool Name,Vendor,Client,Purchase Date,Expiration Date,Total Cost",
        "Purchase Date",
        "Expiration Date",
        "Status",
        "Days Until Expiration",
      ];

      const csvContent = [
        headers.join(","),
        ...purchases.map((purchase) => {
          const expirationDate = new Date(purchase.expiration_date);
          const now = new Date();
          const daysUntilExpiration = differenceInDays(expirationDate, now);
          const status =
            daysUntilExpiration < 0
              ? "Expired"
              : daysUntilExpiration <= 30
                ? "Expiring Soon"
                : "Active";

          return [
            `"${purchase.tool_name}"`,
            `"${purchase.make || ""}"`,
            `"${purchase.model || ""}"`,
            `"${purchase.version || ""}"`,
            `"${purchase.vendor || ""}"`,
            (Number(purchase.cost_per_user || 0) * 83).toFixed(2),
            Number(purchase.cost_per_user || 0).toFixed(2),
            purchase.quantity,
            Number(purchase.total_cost_inr || 0).toFixed(2),
            Number(purchase.total_cost || 0).toFixed(2),
            new Date(purchase.purchase_date).toLocaleDateString(),
            new Date(purchase.expiration_date).toLocaleDateString(),
            status,
            daysUntilExpiration,
          ].join(",");
        }),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const fileName = `license-full-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } else {
      // Summary export logic with detailed license information
      const sections = [];

      // Monthly Summary
      sections.push(
        "# Monthly Investment Summary",
        "Month,Total Cost,Licenses,Purchases",
        ...monthlyData.map((data) =>
          [
            data.month,
            Number(data.totalCostINR || 0).toFixed(2),
            Number(data.totalCost || 0).toFixed(2),
            data.licenses,
            data.purchases,
          ].join(","),
        ),
      );

      // Vendor Summary
      sections.push(
        "",
        "# Vendor Investment Summary",
        "Vendor,Total Investment (INR),Total Investment (USD),Total Licenses",
        ...vendorData.map((data) =>
          [
            `"${data.vendor}"`,
            Number(data.totalCostINR || 0).toFixed(2),
            Number(data.totalCost || 0).toFixed(2),
            data.licenses,
          ].join(","),
        ),
      );

      // Renewal Summary
      sections.push(
        "",
        "# Renewal Status Summary",
        "Status,Count,Total Cost",
        `Active,${renewalData.active.length},,`,
        `Expiring Soon,${renewalData.expiringSoon.length},${Number(renewalData.totalRenewalCostINR || 0).toFixed(2)},${Number(renewalData.totalRenewalCostUSD || 0).toFixed(2)}`,
        `Expired,${renewalData.expired.length},,`,
      );

      // Active Licenses Details
      sections.push(
        "",
        "# Active Licenses Details",
        "Tool Name,Vendor,Version,Licenses,Total Cost,Days Until Expiration",
        ...renewalData.active.map((license) => {
          const daysUntilExpiration = differenceInDays(
            new Date(license.expiration_date),
            new Date(),
          );
          return [
            `"${license.tool_name}"`,
            `"${license.vendor}"`,
            `"${license.version || "N/A"}"`,
            license.quantity,
            Number(license.total_cost_inr || 0).toFixed(2),
            daysUntilExpiration,
          ].join(",");
        }),
      );

      // Expiring Soon Details
      sections.push(
        "",
        "# Licenses Expiring Soon (Next 30 Days)",
        "Tool Name,Vendor,Version,Licenses,Renewal Cost (INR),Days Until Expiration",
        ...renewalData.expiringSoon.map((license) => {
          const daysUntilExpiration = differenceInDays(
            new Date(license.expiration_date),
            new Date(),
          );
          return [
            `"${license.tool_name}"`,
            `"${license.vendor}"`,
            `"${license.version || "N/A"}"`,
            license.quantity,
            Number(license.total_cost_inr || 0).toFixed(2),
            daysUntilExpiration,
          ].join(",");
        }),
      );

      // Expired Licenses Details
      sections.push(
        "",
        "# Expired Licenses Details",
        "Tool Name,Vendor,Version,Licenses,Last Cost (INR),Days Since Expiration",
        ...renewalData.expired.map((license) => {
          const daysSinceExpiration = Math.abs(
            differenceInDays(new Date(license.expiration_date), new Date()),
          );
          return [
            `"${license.tool_name}"`,
            `"${license.vendor}"`,
            `"${license.version || "N/A"}"`,
            license.quantity,
            Number(license.total_cost_inr || 0).toFixed(2),
            daysSinceExpiration,
          ].join(",");
        }),
      );

      const csvContent = sections.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const fileName = `license-summary-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return formatCurrencyUtil(amount, currency);
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const days = differenceInDays(new Date(expirationDate), new Date());
    if (days < 0) {
      return `Expired ${Math.abs(days)} days ago`;
    }
    return `${days} days remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">License Reports</h1>
        </div>
        <div className="p-4 md:p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
          <h3 className="font-medium mb-2">Error Loading Reports</h3>
          <p className="mb-4 text-sm md:text-base">{error}</p>
          <button 
            onClick={fetchLicensePurchases}
            className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (purchases.length === 0 && !loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">License Reports</h1>
        </div>
        <div className="p-4 md:p-6 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-md">
          <h3 className="font-medium mb-2">No License Data Available</h3>
          <p className="mb-4 text-sm md:text-base">No license purchases found in the database. Please add some licenses first to view reports.</p>
          <button 
            onClick={fetchLicensePurchases}
            className="bg-yellow-600 dark:bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Mobile-responsive header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
        
        {/* Tab Navigation - only show if at least one permission is available */}
        {(hasPurchaseAccess || hasSellingAccess) && (
          <div className="flex space-x-2 bg-gray-100 dark:bg-dark-700 p-1 rounded-lg">
            {hasPurchaseAccess && (
              <button
                onClick={() => setActiveTab('purchase')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'purchase'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Purchase Reports
              </button>
            )}
            {hasSellingAccess && (
              <button
                onClick={() => setActiveTab('selling')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'selling'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Sales Reports
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls - stack on mobile, horizontal on desktop */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          {/* Time range filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "6m" | "1y")}
              className="border dark:border-dark-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 min-w-0 flex-1 md:flex-none"
              aria-label="Time range filter"
            >
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 12 Months</option>
            </select>
          </div>
          
          {/* Export controls */}
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={exportFullData}
                onChange={(e) => setExportFullData(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-dark-700"
              />
              <span>Export Full Data</span>
            </label>
            <button
              onClick={handleExport}
              className="flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export {exportFullData ? "Full" : "Summary"} Report</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Reports Tab - only show if user has purchase permission */}
      {activeTab === 'purchase' && hasPurchaseAccess && (
        <>
          {/* Mobile-responsive charts grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {/* Monthly Investment Chart */}
            <div className="bg-white dark:bg-dark-800 p-4 md:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Investment</h2>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalCostINR"
                  name="Investment (INR)"
                  stroke="#10B981"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="licenses"
                  name="Licenses"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Investment Chart */}
        <div className="bg-white dark:bg-dark-800 p-4 md:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Vendor Investment Distribution (INR)
          </h2>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="vendor" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalCostINR"
                  name="Investment (INR)"
                  fill="#10B981"
                />
                <Bar 
                  dataKey="licenses" 
                  name="Licenses" 
                  fill="#3B82F6" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mobile-responsive detailed report */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
        <div className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Detailed Report</h2>
          
          {/* Mobile card layout for small screens, table for larger screens */}
          <div className="block md:hidden space-y-3">
            {monthlyData.map((data, index) => (
              <div key={index} className="border dark:border-dark-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-700">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{data.month}</h3>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data.totalCostINR, "INR")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Licenses:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{data.licenses}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Purchases:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{data.purchases}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Table layout for medium and larger screens */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Licenses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Purchases
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {monthlyData.map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {data.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(data.totalCostINR, "INR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {data.licenses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {data.purchases}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile-responsive Renewal and Maintenance Section */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
        <div className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Renewal and Maintenance Data
          </h2>

          {/* Mobile-responsive summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <h3 className="font-medium text-green-900 dark:text-green-100">Active Licenses</h3>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {renewalData.active.length}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">Expiring Soon</h3>
              </div>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {renewalData.expiringSoon.length}
              </p>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                <p className="font-medium">Total Renewal Cost:</p>
                {renewalData.totalRenewalCostINR > 0 && (
                  <p>{formatCurrency(renewalData.totalRenewalCostINR, "INR")}</p>
                )}
                {renewalData.totalRenewalCostUSD > 0 && (
                  <p>{formatCurrency(renewalData.totalRenewalCostUSD, "USD")}</p>
                )}
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <h3 className="font-medium text-red-900 dark:text-red-100">Expired Licenses</h3>
              </div>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {renewalData.expired.length}
              </p>
            </div>
          </div>

          {/* Mobile-responsive Active Licenses Table */}
          <div className="mb-8">
            <h3 className="text-md font-semibold mb-4 text-green-900 dark:text-green-100 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Active Licenses
            </h3>
            
            {/* Mobile card layout */}
            <div className="block lg:hidden space-y-3">
              {renewalData.active.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  No active licenses found
                </div>
              ) : (
                renewalData.active.map((license) => {
                  const { amount, currency } = getCostAndCurrency(license);
                  return (
                    <div key={license.id} className="border dark:border-dark-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">{license.tool_name}</h4>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(amount, currency)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Vendor:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{license.vendor}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Licenses:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{license.quantity}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">Days Remaining:</span>
                          <p className="font-medium text-green-600 dark:text-green-400">
                            {getDaysUntilExpiration(license.expiration_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Desktop table layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tool Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Licenses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Days Remaining
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {renewalData.active.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No active licenses found
                      </td>
                    </tr>
                  ) : (
                    renewalData.active.map((license) => {
                      const { amount, currency } = getCostAndCurrency(license);
                      return (
                        <tr key={license.id} className="hover:bg-green-50 dark:hover:bg-green-900/10">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {license.tool_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {license.vendor}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {license.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatCurrency(amount, currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                            {getDaysUntilExpiration(license.expiration_date)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile-responsive Expiring Soon Table */}
          <div className="mb-8">
            <h3 className="text-md font-semibold mb-4 text-yellow-900 dark:text-yellow-100 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Licenses Expiring in Next 30 Days
            </h3>
            
            {/* Mobile card layout */}
            <div className="block lg:hidden space-y-3">
              {renewalData.expiringSoon.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  No licenses expiring soon
                </div>
              ) : (
                renewalData.expiringSoon.map((license) => {
                  const { amount, currency } = getCostAndCurrency(license);
                  return (
                    <div key={license.id} className="border dark:border-dark-600 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">{license.tool_name}</h4>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(amount, currency)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Vendor:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{license.vendor}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Licenses:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{license.quantity}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">Expiration:</span>
                          <p className="font-medium text-yellow-600 dark:text-yellow-400">
                            {getDaysUntilExpiration(license.expiration_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Desktop table layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tool Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Licenses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Renewal Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Expiration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {renewalData.expiringSoon.map((license) => {
                    const { amount, currency } = getCostAndCurrency(license);
                    return (
                      <tr key={license.id} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/10">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {license.tool_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {license.vendor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {license.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(amount, currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400">
                          {getDaysUntilExpiration(license.expiration_date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile-responsive Expired Licenses Table */}
          <div>
            <h3 className="text-md font-semibold mb-4 text-red-900 dark:text-red-100 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Expired Licenses
            </h3>
            
            {/* Mobile card layout */}
            <div className="block lg:hidden space-y-3">
              {renewalData.expired.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  No expired licenses found
                </div>
              ) : (
                renewalData.expired.map((license) => {
                  const { amount, currency } = getCostAndCurrency(license);
                  return (
                    <div key={license.id} className="border dark:border-dark-600 rounded-lg p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">{license.tool_name}</h4>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(amount, currency)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Vendor:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{license.vendor}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Licenses:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{license.quantity}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">Expired:</span>
                          <p className="font-medium text-red-600 dark:text-red-400">
                            {getDaysUntilExpiration(license.expiration_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Desktop table layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                <thead className="bg-gray-50 dark:bg-dark-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tool Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Licenses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Expired
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                  {renewalData.expired.map((license) => {
                    const { amount, currency } = getCostAndCurrency(license);
                    return (
                      <tr key={license.id} className="hover:bg-red-50 dark:hover:bg-red-900/10">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {license.tool_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {license.vendor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {license.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(amount, currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                          {getDaysUntilExpiration(license.expiration_date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Sales Reports Tab - only show if user has selling permission */}
      {activeTab === 'selling' && hasSellingAccess && (
        <>
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-dark-800 p-4 md:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</h3>
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{salesStats.totalSales}</p>
            </div>

            <div className="bg-white dark:bg-dark-800 p-4 md:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(salesStats.totalRevenue, 'INR')}
              </p>
            </div>

            <div className="bg-white dark:bg-dark-800 p-4 md:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Profit</h3>
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(salesStats.totalProfit, 'INR')}
              </p>
            </div>

            <div className="bg-white dark:bg-dark-800 p-4 md:p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Margin</h3>
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {salesStats.averageMargin.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Sales Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {/* Monthly Sales Trend */}
            <div className="bg-white dark:bg-dark-800 p-4 md:p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Sales Performance</h2>
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesStats.monthlySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (INR)"
                      stroke="#10B981"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name="Profit (INR)"
                      stroke="#3B82F6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vendor Sales Distribution */}
            <div className="bg-white dark:bg-dark-800 p-4 md:p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Vendor Sales Distribution</h2>
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorSalesStats}
                      dataKey="totalRevenue"
                      nameKey="vendor"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => entry.vendor}
                    >
                      {vendorSalesStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Sales Report Table */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
            <div className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Vendor Performance Details</h2>
              
              {/* Mobile card layout */}
              <div className="block md:hidden space-y-3">
                {vendorSalesStats.map((vendor, index) => (
                  <div key={index} className="border dark:border-dark-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-700">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{vendor.vendor}</h3>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(vendor.totalRevenue, 'INR')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Sales:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{vendor.totalSales}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Profit:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formatCurrency(vendor.totalProfit, 'INR')}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">Margin:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {vendor.averageMargin.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Avg Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                    {vendorSalesStats.map((vendor, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {vendor.vendor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {vendor.totalSales}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(vendor.totalRevenue, 'INR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(vendor.totalProfit, 'INR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {vendor.averageMargin.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Monthly Sales Data Table */}
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
            <div className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Sales Breakdown</h2>
              
              {/* Mobile card layout */}
              <div className="block md:hidden space-y-3">
                {salesStats.monthlySalesData.map((data, index) => (
                  <div key={index} className="border dark:border-dark-600 rounded-lg p-4 bg-gray-50 dark:bg-dark-700">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{data.month}</h3>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(data.revenue, 'INR')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Sales:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{data.sales}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Profit:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formatCurrency(data.profit, 'INR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                    {salesStats.monthlySalesData.map((data, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {data.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {data.sales}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(data.revenue, 'INR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(data.profit, 'INR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
