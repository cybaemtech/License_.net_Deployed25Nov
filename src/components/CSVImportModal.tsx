import { useState } from 'react';
import { Upload, X, Download, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateUrl: string;
  importUrl: string;
  onSuccess: () => void;
}

interface ImportResult {
  imported: number;
  failed: number;
  total: number;
  errors: string[];
  warnings: string[];
}

export default function CSVImportModal({
  isOpen,
  onClose,
  title,
  templateUrl,
  importUrl,
  onSuccess,
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(templateUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csv_file', file);

      const session = localStorage.getItem('auth_session');
      let authHeaders: Record<string, string> = {};
      if (session) {
        try {
          const userData = JSON.parse(session);
          if (userData.token) {
            authHeaders['Authorization'] = `Bearer ${userData.token}`;
          }
        } catch (e) {
          console.error('Failed to parse session data');
        }
      }

      const response = await fetch(importUrl, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        if (data.data.failed === 0) {
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 2000);
        }
      } else {
        setError(data.message || 'Import failed');
      }
    } catch (err) {
      setError('Failed to import CSV file');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-2">Import Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download the CSV template below</li>
                  <li>Fill in your data following the template format</li>
                  <li>Upload the completed CSV file</li>
                  <li>Review the import results</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              Download CSV Template
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  {file ? file.name : 'Click to select CSV file or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">CSV files only</p>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div
                className={`border rounded-lg p-4 ${
                  result.failed === 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {result.failed === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  )}
                  <div>
                    <h3
                      className={`font-medium ${
                        result.failed === 0 ? 'text-green-900' : 'text-yellow-900'
                      }`}
                    >
                      Import Results
                    </h3>
                    <p
                      className={`text-sm ${
                        result.failed === 0 ? 'text-green-700' : 'text-yellow-700'
                      }`}
                    >
                      {result.imported} of {result.total} records imported successfully
                      {result.failed > 0 && `, ${result.failed} failed`}
                    </p>
                  </div>
                </div>

                {result.warnings.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-yellow-900 mb-2">Warnings:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-red-900 mb-2">Errors:</h4>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {result && result.failed === 0 ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleImport}
              disabled={!file || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
