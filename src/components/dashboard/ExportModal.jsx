import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { exportProductsToCSV, exportPresets } from '../../utils/exportUtils';

const ExportModal = ({ isOpen, onClose, currentFilters = {} }) => {
  const { token } = useContext(AuthContext);

  const [selectedPreset, setSelectedPreset] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [error, setError] = useState(null);

  const presetOptions = [
    {
      id: 'all',
      name: 'All Products (Full Export)',
      description: 'All fields including images, specifications, dimensions',
      icon: '📦',
      fields: 'All fields',
      useCase: 'Complete backup or data migration',
    },
    {
      id: 'withImages',
      name: 'Products with Images',
      description: 'SKU, Name, Price, and Image URLs',
      icon: '🖼️',
      fields: 'sku, name, price, images',
      useCase: 'Image audit or catalog review',
    },
    {
      id: 'basic',
      name: 'Basic Information',
      description: 'Essential product details',
      icon: '📋',
      fields: 'sku, name, price, stock, availability',
      useCase: 'Quick inventory check',
    },
    {
      id: 'inStock',
      name: 'In Stock Products',
      description: 'Only available products',
      icon: '✅',
      fields: 'sku, name, price, stock',
      useCase: 'Available inventory report',
    },
    {
      id: 'outOfStock',
      name: 'Out of Stock Products',
      description: 'Products needing restock',
      icon: '⚠️',
      fields: 'sku, name, stock, category',
      useCase: 'Restocking planning',
    },
    {
      id: 'pricing',
      name: 'Pricing Information',
      description: 'For price updates and analysis',
      icon: '💰',
      fields: 'sku, name, price, sale price, category',
      useCase: 'Price management',
    },
    {
      id: 'inventory',
      name: 'Inventory Audit',
      description: 'Stock levels and physical details',
      icon: '📊',
      fields: 'sku, name, stock, weight, dimensions',
      useCase: 'Warehouse inventory audit',
    },
    {
      id: 'featured',
      name: 'Featured Products',
      description: 'Highlighted promotional items',
      icon: '⭐',
      fields: 'All fields',
      useCase: 'Marketing and promotions',
    },
  ];

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setExportResult(null);

    try {
      const preset = exportPresets[selectedPreset];
      const filters = selectedPreset === 'all' ? currentFilters : preset.filters;

      const result = await exportProductsToCSV({
        token,
        filters,
        onSuccess: ({ totalProducts, filename }) => {
          setExportResult({
            totalProducts,
            filename,
            preset: presetOptions.find(p => p.id === selectedPreset)?.name,
          });
        },
        onError: (err) => {
          setError(err.message);
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    setSelectedPreset('all');
    setExportResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Export Products</h2>
            <p className="text-sm text-gray-600 mt-1">Choose an export format and download your product data</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">Export Failed</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {exportResult && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">Export Successful!</p>
            </div>
            <div className="mt-2 text-sm text-green-700">
              <p><strong>{exportResult.totalProducts}</strong> products exported</p>
              <p className="text-xs text-green-600 mt-1">Format: {exportResult.preset}</p>
              <p className="text-xs text-green-600">File: {exportResult.filename}</p>
            </div>
          </div>
        )}

        {/* Export Presets Grid */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Export Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {presetOptions.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedPreset === preset.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{preset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{preset.name}</h4>
                      {selectedPreset === preset.id && (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Fields:</span> {preset.fields}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Use case:</span> {preset.useCase}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Export Information</p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1">
                <li>• CSV format compatible with Excel and Google Sheets</li>
                <li>• Exported files can be re-imported using the bulk import feature</li>
                <li>• Image URLs are included as comma-separated values</li>
                <li>• File includes timestamp for easy organization</li>
                {selectedPreset === 'all' && currentFilters && Object.keys(currentFilters).length > 0 && (
                  <li className="text-blue-800 font-medium">• Will respect your current active filters</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export to CSV
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={exporting}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exportResult ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
