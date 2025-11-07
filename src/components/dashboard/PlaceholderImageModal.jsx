import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  getProductsWithoutImages,
  uploadPlaceholderImage,
  useExistingMediaAsPlaceholder,
  useExternalUrlAsPlaceholder,
  applyPlaceholderToProducts
} from '../../services/products';

const PlaceholderImageModal = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useContext(AuthContext);

  // State
  const [step, setStep] = useState(1); // 1: Check products, 2: Set placeholder, 3: Apply
  const [productsWithoutImages, setProductsWithoutImages] = useState([]);
  const [placeholderUrl, setPlaceholderUrl] = useState('');
  const [placeholderSource, setPlaceholderSource] = useState(''); // 'uploaded', 'media_library', 'external_url'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('upload'); // 'upload', 'media', 'external'

  // Form inputs
  const [mediaUrl, setMediaUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setStep(1);
      setProductsWithoutImages([]);
      setPlaceholderUrl('');
      setPlaceholderSource('');
      setError(null);
      setSuccess(null);
      setMediaUrl('');
      setExternalUrl('');
      setUploadMethod('upload');

      // Automatically fetch products on open
      fetchProductsWithoutImages();
    }
  }, [isOpen]);

  const fetchProductsWithoutImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProductsWithoutImages(token);
      if (response.success) {
        setProductsWithoutImages(response.products || []);
        setSuccess(`Found ${response.count || 0} products without images`);
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await uploadPlaceholderImage(token, file);
      if (response.success) {
        setPlaceholderUrl(response.absoluteUrl || response.placeholderUrl);
        setPlaceholderSource(response.source || 'uploaded');
        setSuccess('Placeholder image uploaded successfully!');
        setStep(3);
      } else {
        setError(response.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMediaLibrary = async () => {
    if (!mediaUrl.trim()) {
      setError('Please enter a media library URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await useExistingMediaAsPlaceholder(token, mediaUrl.trim());
      if (response.success) {
        setPlaceholderUrl(response.absoluteUrl || response.placeholderUrl);
        setPlaceholderSource(response.source || 'media_library');
        setSuccess('Placeholder set from media library!');
        setStep(3);
      } else {
        setError(response.message || 'Failed to set placeholder');
      }
    } catch (err) {
      setError('Failed to set placeholder: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExternalUrl = async () => {
    if (!externalUrl.trim()) {
      setError('Please enter an external image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(externalUrl.trim());
    } catch {
      setError('Invalid URL format. Please enter a valid HTTP/HTTPS URL.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await useExternalUrlAsPlaceholder(token, externalUrl.trim());
      if (response.success) {
        setPlaceholderUrl(response.absoluteUrl || response.placeholderUrl);
        setPlaceholderSource(response.source || 'external_url');
        setSuccess('External URL set as placeholder!');
        setStep(3);
      } else {
        setError(response.message || 'Failed to set external URL');
      }
    } catch (err) {
      setError('Failed to set external URL: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlaceholder = async () => {
    if (!placeholderUrl) {
      setError('No placeholder image set');
      return;
    }

    if (productsWithoutImages.length === 0) {
      setError('No products to apply placeholder to');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await applyPlaceholderToProducts(token, placeholderUrl);
      if (response.success) {
        setSuccess(`Placeholder applied to ${response.updated || 0} products!`);

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Auto-close after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to apply placeholder');
      }
    } catch (err) {
      setError('Failed to apply placeholder: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setProductsWithoutImages([]);
    setPlaceholderUrl('');
    setPlaceholderSource('');
    setError(null);
    setSuccess(null);
    setMediaUrl('');
    setExternalUrl('');
    setUploadMethod('upload');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Placeholder Image Manager</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <div className={`w-20 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <div className={`w-20 h-1 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Check Products</span>
            <span>Set Placeholder</span>
            <span>Apply</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Step 1: Products Without Images */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Products Without Images</h3>
              <p className="text-sm text-gray-600 mb-4">
                {productsWithoutImages.length > 0
                  ? `Found ${productsWithoutImages.length} products without images`
                  : 'Checking for products without images...'}
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : productsWithoutImages.length > 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-2">
                    {productsWithoutImages.slice(0, 10).map((product) => (
                      <li key={product._id} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <span className="font-medium">{product.name}</span>
                        {product.sku && <span className="text-gray-500">({product.sku})</span>}
                      </li>
                    ))}
                    {productsWithoutImages.length > 10 && (
                      <li className="text-sm text-gray-500 italic">
                        ... and {productsWithoutImages.length - 10} more
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700">All products have images!</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={productsWithoutImages.length === 0 || loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Next: Set Placeholder
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Set Placeholder Image */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Set Placeholder Image</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose how to set the placeholder image for products without images
              </p>

              {/* Method Selection */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUploadMethod('upload')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    uploadMethod === 'upload'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Upload New
                </button>
                <button
                  onClick={() => setUploadMethod('media')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    uploadMethod === 'media'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Media Library
                </button>
                <button
                  onClick={() => setUploadMethod('external')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    uploadMethod === 'external'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  External URL
                </button>
              </div>

              {/* Upload New Image */}
              {uploadMethod === 'upload' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <label className="text-indigo-600 hover:text-indigo-500 cursor-pointer font-medium">
                      Choose a file
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    JPEG, PNG, GIF, WebP up to 5MB
                  </p>
                </div>
              )}

              {/* Use Media Library */}
              {uploadMethod === 'media' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Media Library URL
                  </label>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <button
                    onClick={handleUseMediaLibrary}
                    disabled={loading || !mediaUrl.trim()}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Setting...' : 'Use This Image'}
                  </button>
                </div>
              )}

              {/* Use External URL */}
              {uploadMethod === 'external' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    External Image URL
                  </label>
                  <input
                    type="text"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://example.com/placeholder.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <button
                    onClick={handleUseExternalUrl}
                    disabled={loading || !externalUrl.trim()}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Setting...' : 'Use This URL'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Apply Placeholder */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Apply Placeholder</h3>
              <p className="text-sm text-gray-600 mb-4">
                Review and apply the placeholder image to all products without images
              </p>

              {/* Preview Placeholder */}
              {placeholderUrl && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Placeholder Preview:</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={placeholderUrl}
                      alt="Placeholder"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 break-all">{placeholderUrl}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Source: {placeholderSource === 'uploaded' ? 'Uploaded' : placeholderSource === 'media_library' ? 'Media Library' : 'External URL'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Products to Update */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  This will apply the placeholder to {productsWithoutImages.length} product{productsWithoutImages.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-yellow-700">
                  Products with images will not be affected
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApplyPlaceholder}
                disabled={loading || !placeholderUrl}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply to {productsWithoutImages.length} Products
                  </>
                )}
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceholderImageModal;
