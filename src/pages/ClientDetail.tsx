import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Package,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { getApiBaseUrl } from "../utils/api";
import { format } from "date-fns";
import SimpleCurrencyDisplay from "../components/SimpleCurrencyDisplay";
import SimpleDocumentViewer from "../components/SimpleDocumentViewer";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
  address?: string;
  company_name?: string;
  gst_treatment?: string;
  gst?: string;
  contact_person?: string;
  source_of_supply?: string;
  display_name?: string;
  currency_id?: string;
  mode_of_payment?: string;
  status?: string;
  amount?: number;
  quantity?: number;
  currency_name?: string;
  currency_symbol?: string;
  currency_code?: string;
  document_path?: string;
}

interface License {
  id: string;
  tool_name: string;
  tool_description: string;
  tool_vendor: string;
  purchase_date: string;
  expiry_date: string;
  number_of_users: number;
  cost_per_user: number;
  total_cost: number;
  total_cost_inr: number;
  currency_code: string;
  currency_symbol: string;
  status: string;
}

interface ClientData {
  client: Client;
  licenses: License[];
  stats: {
    total_licenses: number;
    active_licenses: number;
    expired_licenses: number;
    total_cost: number;
  };
}

function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<{ path: string; title: string } | null>(null);

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/clients/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch client details");
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch client details"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "expired":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "cancelled":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <XCircle className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading client details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 mt-5">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error || "Client not found"}
        </div>
      </div>
    );
  }

  const { client, licenses, stats } = data;

  return (
    <div className="space-y-6 mt-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {client.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Client since {format(new Date(client.created_at), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t dark:border-dark-600 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Client Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.display_name && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Display Name:
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {client.display_name}
                </p>
              </div>
            )}
            {client.contact_person && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Contact Person:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {client.contact_person}
                </p>
              </div>
            )}
            {client.phone && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Phone:
                </p>
                <div className="flex items-center text-gray-900 dark:text-white">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{client.phone}</span>
                </div>
              </div>
            )}
            {client.email && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Email:
                </p>
                <div className="flex items-center text-gray-900 dark:text-white">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{client.email}</span>
                </div>
              </div>
            )}
            {client.company_name && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Company Name:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {client.company_name}
                </p>
              </div>
            )}
            {client.gst && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  GST Number:
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {client.gst}
                </p>
              </div>
            )}
            {client.gst_treatment && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  GST Treatment:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {client.gst_treatment}
                </p>
              </div>
            )}
            {client.source_of_supply && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Source of Supply:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {client.source_of_supply}
                </p>
              </div>
            )}
            {client.address && (
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Address:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {client.address}
                </p>
              </div>
            )}
            {(client.currency_name || client.currency_code) && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Currency:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {client.currency_name || client.currency_code}
                  {client.currency_symbol && ` (${client.currency_symbol})`}
                </p>
              </div>
            )}
            {client.mode_of_payment && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Mode of Payment:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {client.mode_of_payment}
                </p>
              </div>
            )}
            {client.status && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Status:
                </p>
                <p className="text-gray-900 dark:text-white capitalize">
                  {client.status}
                </p>
              </div>
            )}
            {client.document_path && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Document:
                </p>
                <button
                  onClick={() => {
                    setViewerDocument({ 
                      path: client.document_path!, 
                      title: `${client.name} - Document` 
                    });
                    setViewerOpen(true);
                  }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-500 bg-green-50 dark:bg-green-900/20 rounded-md transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Licenses
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total_licenses}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.active_licenses}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.expired_licenses}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Cost {client.currency_code && client.currency_code !== 'INR' && `(${client.currency_symbol || client.currency_code})`}
              </p>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {client.currency_symbol || (client.currency_code && client.currency_code !== 'INR' ? client.currency_code : '₹')}
                {Number(stats.total_cost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <IndianRupee className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-dark-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            License Purchases
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product/Tool
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Purchase Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Expiry Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
              {licenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No licenses found for this client
                  </td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr
                    key={license.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-700"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {license.tool_name || "N/A"}
                      </div>
                      {license.tool_description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {license.tool_description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                      {license.tool_vendor || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {format(new Date(license.purchase_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {format(new Date(license.expiry_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {license.number_of_users}
                    </td>
                    <td className="px-4 py-3">
                      <SimpleCurrencyDisplay 
                        inrAmount={Number(license.total_cost_inr)} 
                        originalAmount={Number(license.total_cost)}
                        originalCurrency={license.currency_code}
                        preferredCurrency={client.currency_code || 'INR'}
                        className="text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          license.status
                        )}`}
                      >
                        {getStatusIcon(license.status)}
                        <span className="ml-1 capitalize">{license.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewerDocument && (
        <SimpleDocumentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setViewerDocument(null);
          }}
          documentPath={viewerDocument.path}
          title={viewerDocument.title}
        />
      )}
    </div>
  );
}

export default ClientDetail;
