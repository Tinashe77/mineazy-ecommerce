import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateProduct } from '../../services/products';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

const AddProductImages = ({ isOpen, onClose, product, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (validFiles.length === 0) {
      setError('Please select valid image files (JPEG, PNG, GIF, WebP, AVIF)');
      return;
    }

    if (invalidFiles.length > 0) {
      setError(`Skipped ${invalidFiles.length} invalid file(s). Only JPEG, PNG, GIF, WebP, and AVIF are allowed.`);
    } else {
      setError(null);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, { name: file.name, url: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Append all selected images
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await updateProduct(token, product._id, formData);

      if (response.success !== false) {
        alert(`Successfully added ${selectedFiles.length} image(s) to ${product.name}`);
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      } else {
        setError(response.message || 'Failed to upload images');
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setError(null);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Images</h2>
            <p className="text-sm text-gray-600 mt-1">
              Product: <span className="font-semibold">{product.name}</span>
              {product.sku && <span className="text-gray-500"> (SKU: {product.sku})</span>}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Images Count */}
        {product.images && product.images.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Current images: <strong>{product.images.length}</strong>
            </p>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div className="mb-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop images here, or{' '}
              <label className="text-indigo-600 hover:text-indigo-500 cursor-pointer font-medium">
                browse
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.webp,.avif"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supported: JPEG, PNG, GIF, WebP, AVIF (max 5MB each)
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Image Previews */}
        {previews.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Selected Images ({previews.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">{preview.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload {selectedFiles.length} Image{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductImages;
