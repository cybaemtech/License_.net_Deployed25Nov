import { useState, useEffect } from 'react';
import { X, FileText, Download } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

interface LicensePurchase {
  id: string;
  tool_name: string;
  vendor: string;
  invoice_no: string;
  purchase_date: string;
  document_path?: string;
  bill_path?: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string;
}

function DocumentViewerModal({ isOpen, onClose, purchaseId }: DocumentViewerModalProps) {
  const [purchase, setPurchase] = useState<LicensePurchase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<'bill' | 'document' | null>(null);

  useEffect(() => {
    if (isOpen && purchaseId) {
      fetchPurchaseDocuments();
    } else {
      resetState();
    }
  }, [isOpen, purchaseId]);

  const resetState = () => {
    setPurchase(null);
    setError(null);
    setSelectedDoc(null);
  };

  const fetchPurchaseDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `${getApiBaseUrl()}/licenses/${purchaseId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch purchase documents: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPurchase(result.data);
        if (result.data.bill_path) {
          setSelectedDoc('bill');
        } else if (result.data.document_path) {
          setSelectedDoc('document');
        }
      } else {
        throw new Error(result.message || 'Failed to fetch purchase');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFullPath = (documentPath: string) => {
    const basePath = import.meta.env.BASE_URL || '/';
    return documentPath.startsWith('http') 
      ? documentPath 
      : `${window.location.origin}${basePath}${documentPath.startsWith('/') ? documentPath.substring(1) : documentPath}`;
  };

  if (!isOpen) return null;

  const currentDocPath = selectedDoc === 'bill' ? purchase?.bill_path : purchase?.document_path;
  const isPDF = currentDocPath?.toLowerCase().endsWith('.pdf');
  const isImage = currentDocPath ? /\.(jpg|jpeg|png|gif|webp)$/i.test(currentDocPath) : false;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-6xl mx-4 my-8 flex flex-col max-h-[90vh]">
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-white" />
              <h3 className="text-lg font-semibold text-white">
                License Documents
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {currentDocPath && (
                <a
                  href={getFullPath(currentDocPath)}
                  download
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Download Document"
                >
                  <Download className="h-5 w-5" />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : error ? (
              <div className="m-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            ) : purchase ? (
              <>
                <div className="p-6 bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    License Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">License Name:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {purchase.tool_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Vendor:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {purchase.vendor}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Invoice No:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {purchase.invoice_no || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Purchase Date:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {new Date(purchase.purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {(purchase.bill_path || purchase.document_path) && (
                    <div className="mt-4 flex gap-2">
                      {purchase.bill_path && (
                        <button
                          onClick={() => setSelectedDoc('bill')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedDoc === 'bill'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white dark:bg-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-500'
                          }`}
                        >
                          Bill/Invoice
                        </button>
                      )}
                      {purchase.document_path && (
                        <button
                          onClick={() => setSelectedDoc('document')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedDoc === 'document'
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white dark:bg-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-500'
                          }`}
                        >
                          Document
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 p-6 bg-gray-50 dark:bg-dark-700">
                  {currentDocPath ? (
                    isPDF ? (
                      <iframe
                        src={getFullPath(currentDocPath)}
                        className="w-full h-full min-h-[500px] rounded-lg shadow-lg"
                        title={`${purchase.tool_name} - ${selectedDoc === 'bill' ? 'Bill' : 'Document'}`}
                      />
                    ) : isImage ? (
                      <div className="flex items-center justify-center h-full">
                        <img
                          src={getFullPath(currentDocPath)}
                          alt={`${purchase.tool_name} - ${selectedDoc === 'bill' ? 'Bill' : 'Document'}`}
                          className="max-w-full max-h-full rounded-lg shadow-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                          Document preview not available
                        </p>
                        <a
                          href={getFullPath(currentDocPath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                          Open in New Tab
                        </a>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No documents uploaded for this license
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentViewerModal;
