import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateProduct } from '../../services/products';
import { getMedia } from '../../services/media';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

const AddProductImages = ({ isOpen, onClose, product, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'library'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Media library states
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [selectedExistingImages, setSelectedExistingImages] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaPagination, setMediaPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false
  });

  // Fetch media library when tab changes to library
  useEffect(() => {
    if (activeTab === 'library' && isOpen) {
      fetchMediaLibrary();
    }
  }, [activeTab, isOpen]);

  const fetchMediaLibrary = async (page = 1, append = false) => {
    setLoadingMedia(true);
    try {
      const params = {
        page,
        limit: 24,
        folder: 'products',
      };

      if (searchQuery.trim()) {
        params.search = searchQuery;
      }

      const response = await getMedia(token, params);
      if (response.media) {
        if (append) {
          setMediaLibrary(prev => [...prev, ...response.media]);
        } else {
          setMediaLibrary(response.media);
        }

        if (response.pagination) {
          setMediaPagination({
            currentPage: response.pagination.currentPage,
            totalPages: response.pagination.totalPages,
            hasNext: response.pagination.hasNext
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch media library:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleLoadMore = () => {
    fetchMediaLibrary(mediaPagination.currentPage + 1, true);
  };

  const handleToggleExistingImage = (mediaItem) => {
    setSelectedExistingImages(prev => {
      const isSelected = prev.some(img => img._id === mediaItem._id);
      if (isSelected) {
        return prev.filter(img => img._id !== mediaItem._id);
      } else {
        return [...prev, mediaItem];
      }
    });
  };

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
    const totalSelected = selectedFiles.length + selectedExistingImages.length;

    if (totalSelected === 0) {
      setError('Please select at least one image');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Append new image files
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      // Append existing image URLs
      if (selectedExistingImages.length > 0) {
        const existingUrls = selectedExistingImages.map(img => img.url);
        formData.append('existingImageUrls', JSON.stringify(existingUrls));
      }

      const response = await updateProduct(token, product._id, formData);

      if (response.success !== false) {
        alert(`Successfully added ${totalSelected} image(s) to ${product.name}`);
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
    setSelectedExistingImages([]);
    setError(null);
    setActiveTab('upload');
    setSearchQuery('');
    setMediaLibrary([]);
    setMediaPagination({
      currentPage: 1,
      totalPages: 1,
      hasNext: false
    });
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

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'upload'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload New
              {activeTab === 'upload' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'library'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Select from Library
              {activeTab === 'library' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></span>
              )}
            </button>
          </nav>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
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
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="mb-6">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMediaLibrary(1, false)}
                placeholder="Search images in library..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => fetchMediaLibrary(1, false)}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                Search
              </button>
            </div>

            {/* Loading State */}
            {loadingMedia && (
              <div className="flex justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}

            {/* Media Grid */}
            {!loadingMedia && mediaLibrary.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-1">
                  {mediaLibrary.map((mediaItem) => {
                    const isSelected = selectedExistingImages.some(img => img._id === mediaItem._id);
                    return (
                      <div
                        key={mediaItem._id}
                        onClick={() => handleToggleExistingImage(mediaItem)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-200'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <img
                          src={mediaItem.thumbnail || mediaItem.url}
                          alt={mediaItem.alt || mediaItem.originalName}
                          className="w-full h-32 object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate">{mediaItem.originalName}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Info & Load More */}
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <p>
                    Showing {mediaLibrary.length} images
                    {mediaPagination.totalPages > 1 && (
                      <span> • Page {mediaPagination.currentPage} of {mediaPagination.totalPages}</span>
                    )}
                  </p>
                  {mediaPagination.hasNext && (
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMedia}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      {loadingMedia ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Empty State */}
            {!loadingMedia && mediaLibrary.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No images found in the library</p>
                <p className="text-xs mt-1">Upload images to the Media Library first</p>
              </div>
            )}

            {/* Selected from Library */}
            {selectedExistingImages.length > 0 && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-indigo-800 font-medium">
                  {selectedExistingImages.length} image{selectedExistingImages.length !== 1 ? 's' : ''} selected from library
                </p>
              </div>
            )}
          </div>
        )}

        {/* Summary before upload */}
        {(selectedFiles.length > 0 || selectedExistingImages.length > 0) && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">Ready to add:</p>
            <ul className="text-sm text-green-700 mt-1 space-y-1">
              {selectedFiles.length > 0 && (
                <li>• {selectedFiles.length} new image{selectedFiles.length !== 1 ? 's' : ''} to upload</li>
              )}
              {selectedExistingImages.length > 0 && (
                <li>• {selectedExistingImages.length} existing image{selectedExistingImages.length !== 1 ? 's' : ''} from library</li>
              )}
            </ul>
          </div>
        )}

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
            disabled={uploading || (selectedFiles.length === 0 && selectedExistingImages.length === 0)}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding Images...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Add {selectedFiles.length + selectedExistingImages.length} Image{(selectedFiles.length + selectedExistingImages.length) !== 1 ? 's' : ''}
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
