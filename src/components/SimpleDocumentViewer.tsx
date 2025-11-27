import { X, Download } from 'lucide-react';

interface SimpleDocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentPath: string;
  title: string;
}

function SimpleDocumentViewer({ isOpen, onClose, documentPath, title }: SimpleDocumentViewerProps) {
  if (!isOpen) return null;

  const basePath = import.meta.env.BASE_URL || '/';
  const fullPath = documentPath.startsWith('http') 
    ? documentPath 
    : `${window.location.origin}${basePath}${documentPath.startsWith('/') ? documentPath.substring(1) : documentPath}`;

  const isPDF = documentPath.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(documentPath);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-6xl mx-4 my-8 flex flex-col max-h-[90vh]">
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <div className="flex items-center gap-2">
              <a
                href={fullPath}
                download
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Download Document"
              >
                <Download className="h-5 w-5" />
              </a>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-dark-700">
            {isPDF ? (
              <iframe
                src={fullPath}
                className="w-full h-full min-h-[600px] rounded-lg shadow-lg"
                title={title}
              />
            ) : isImage ? (
              <div className="flex items-center justify-center">
                <img
                  src={fullPath}
                  alt={title}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Document preview not available
                </p>
                <a
                  href={fullPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Open in New Tab
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleDocumentViewer;
