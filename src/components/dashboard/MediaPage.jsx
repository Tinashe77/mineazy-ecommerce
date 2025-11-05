import { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getMedia, uploadMedia, deleteMedia, bulkDeleteMedia, getMediaStats } from '../../services/media';

const MediaPage = () => {
  const [media, setMedia] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  // Stats
  const [stats, setStats] = useState(null);

  // Filters and sorting
  const [filters, setFilters] = useState({
    search: '',
    folder: '',
    tags: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Selection for bulk operations
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadOptions, setUploadOptions] = useState({
    folder: 'general',
    tags: '',
    alt: '',
    title: '',
  });
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);

  // Image preview modal
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchMedia();
    fetchStats();
  }, []);

  useEffect(() => {
    setSelectedMedia([]);
    setSelectAll(false);
  }, [media]);

  const fetchStats = async () => {
    const response = await getMediaStats(token);
    if (response && !response.success === false) {
      setStats(response);
    }
  };

  const fetchMedia = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 24,
        ...filters,
      };

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await getMedia(token, params);

      if (response.media) {
        setMedia(response.media);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch media');
      }
    } catch (err) {
      setError('Failed to fetch media: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMedia(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      folder: '',
      tags: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setTimeout(() => fetchMedia(1), 0);
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMedia([]);
    } else {
      setSelectedMedia(media.map(m => m._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectMedia = (mediaId) => {
    setSelectedMedia(prev => {
      if (prev.includes(mediaId)) {
        return prev.filter(id => id !== mediaId);
      } else {
        return [...prev, mediaId];
      }
    });
  };

  // Upload handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setUploadFiles(prev => [...prev, ...imageFiles]);
  };

  const removeUploadFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress({ uploaded: 0, total: uploadFiles.length });

    try {
      const response = await uploadMedia(token, uploadFiles, uploadOptions);

      if (response.uploaded) {
        alert(`Successfully uploaded ${response.uploaded.length} image(s)`);
        setUploadFiles([]);
        setShowUploadModal(false);
        setUploadProgress(null);
        fetchMedia(pagination.currentPage);
        fetchStats();
      } else {
        alert('Upload failed: ' + response.message);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // Delete handlers
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await deleteMedia(token, id, { force: true });

      if (response.message) {
        fetchMedia(pagination.currentPage);
        fetchStats();
      } else {
        alert('Failed to delete media: ' + response.message);
      }
    } catch (error) {
      alert('Failed to delete media: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMedia.length === 0) {
      alert('Please select media to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedMedia.length} image${selectedMedia.length > 1 ? 's' : ''}? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await bulkDeleteMedia(token, selectedMedia, { force: true });

      if (response.results) {
        const { deleted, failed } = response.results;
        let message = `Bulk delete completed!\n`;
        if (deleted > 0) message += `✓ ${deleted} images deleted successfully\n`;
        if (failed > 0) message += `✗ ${failed} images failed to delete`;

        alert(message);
        setSelectedMedia([]);
        setSelectAll(false);
        fetchMedia(pagination.currentPage);
        fetchStats();
      } else {
        alert('Bulk delete failed: ' + response.message);
      }
    } catch (error) {
      alert('Bulk delete failed: ' + error.message);
    }
  };

  const handlePreview = (mediaItem) => {
    setPreviewImage(mediaItem);
    setShowPreviewModal(true);
  };

  const copyImageUrl = (url) => {
    navigator.clipboard.writeText(url);
    alert('Image URL copied to clipboard!');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && media.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Media Library</h1>
          {stats && (
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalMedia} images • {stats.totalSizeMB} MB used • {stats.storageType === 'cloudinary' ? 'Cloudinary Storage' : 'Local Storage'}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Images
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedMedia.length > 0 && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-indigo-900">
              {selectedMedia.length} image{selectedMedia.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => {
                setSelectedMedia([]);
                setSelectAll(false);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 underline"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Selected
          </button>
        </div>
      )}

      {/* Filters Section */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium text-gray-700">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </span>
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Reset All
            </button>
          </div>

          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Filename, title, or tags"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Folder</label>
                <select
                  name="folder"
                  value={filters.folder}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All Folders</option>
                  <option value="general">General</option>
                  <option value="products">Products</option>
                  <option value="categories">Categories</option>
                  <option value="blog">Blog</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={filters.tags}
                  onChange={handleFilterChange}
                  placeholder="e.g., banner, hero"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="createdAt">Upload Date</option>
                  <option value="originalName">Name</option>
                  <option value="size">File Size</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <select
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {pagination.totalMedia !== undefined && (
        <div className="mb-4 text-gray-600">
          Showing {media.length} of {pagination.totalMedia} images
        </div>
      )}

      {/* Grid View with Select Option */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {media.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label className="text-sm text-gray-700 font-medium">Select All</label>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {media.map((item) => (
            <div
              key={item._id}
              className={`relative group border-2 rounded-lg overflow-hidden transition-all ${
                selectedMedia.includes(item._id) ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedMedia.includes(item._id)}
                  onChange={() => handleSelectMedia(item._id)}
                  className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Image */}
              <div
                className="aspect-square bg-gray-100 cursor-pointer"
                onClick={() => handlePreview(item)}
              >
                <img
                  src={item.thumbnail || item.url}
                  alt={item.alt || item.originalName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handlePreview(item)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Preview"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => copyImageUrl(item.url)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Copy URL"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Image info */}
              <div className="p-2 bg-white border-t border-gray-200">
                <p className="text-xs text-gray-900 font-medium truncate" title={item.originalName}>
                  {item.originalName}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>

        {media.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">No images found. Upload some images to get started!</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => fetchMedia(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {[...Array(pagination.totalPages)].map((_, index) => {
              const page = index + 1;
              const showPage =
                page === 1 ||
                page === pagination.totalPages ||
                (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1);

              if (!showPage && page === 2) {
                return <span key={page} className="px-3 py-2">...</span>;
              }

              if (!showPage && page === pagination.totalPages - 1) {
                return <span key={page} className="px-3 py-2">...</span>;
              }

              if (!showPage) return null;

              return (
                <button
                  key={page}
                  onClick={() => fetchMedia(page)}
                  className={`px-4 py-2 border rounded-lg ${
                    pagination.currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => fetchMedia(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Upload Images</h2>

            {/* Upload Options */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Folder</label>
                <select
                  value={uploadOptions.folder}
                  onChange={(e) => setUploadOptions(prev => ({ ...prev, folder: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="general">General</option>
                  <option value="products">Products</option>
                  <option value="categories">Categories</option>
                  <option value="blog">Blog</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadOptions.tags}
                  onChange={(e) => setUploadOptions(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., banner, hero, product"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors mb-4"
            >
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 mb-2">Click to browse or drag and drop images here</p>
              <p className="text-sm text-gray-500">Supports: JPG, PNG, GIF, WebP (Max 5MB per file)</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File Preview */}
            {uploadFiles.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Selected Files ({uploadFiles.length})</h3>
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded border border-gray-300"
                      />
                      <button
                        onClick={() => removeUploadFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <p className="text-xs text-gray-600 truncate mt-1" title={file.name}>
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  Uploading {uploadProgress.uploaded} of {uploadProgress.total} images...
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || uploading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} Image${uploadFiles.length !== 1 ? 's' : ''}`}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFiles([]);
                  setUploadProgress(null);
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div className="text-white">
                <h3 className="text-xl font-bold">{previewImage.originalName}</h3>
                <p className="text-sm text-gray-300">
                  {formatFileSize(previewImage.size)} • {previewImage.folder} • Uploaded {formatDate(previewImage.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4">
              <img
                src={previewImage.url}
                alt={previewImage.alt}
                className="max-w-full max-h-[70vh] mx-auto"
              />
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Alt Text:</p>
                  <p className="font-medium">{previewImage.alt || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">MIME Type:</p>
                  <p className="font-medium">{previewImage.mimeType}</p>
                </div>
                {previewImage.tags && previewImage.tags.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-gray-600 mb-1">Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {previewImage.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-gray-600 mb-1">URL:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={previewImage.url}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => copyImageUrl(previewImage.url)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPage;
