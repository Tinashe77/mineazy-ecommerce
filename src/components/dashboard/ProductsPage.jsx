import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getProducts, deleteProduct, bulkImportProducts, downloadSampleCSV, downloadUpdateSampleCSV } from '../../services/products';
import { getCategories } from '../../services/categories';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);
  const [showFilters, setShowFilters] = useState(false);

  // Selection states for bulk delete
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    inStock: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Bulk import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importOptions, setImportOptions] = useState({
    updateExisting: true,
    fieldsToUpdate: 'all',
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Reset selection when products change
  useEffect(() => {
    setSelectedProducts([]);
    setSelectAll(false);
  }, [products]);

  const fetchCategories = async () => {
    const response = await getCategories({ activeOnly: true });
    if (response.categories) {
      setCategories(response.categories);
    }
  };

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        limit: 20,
        ...filters,
      };

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await getProducts(params);
      
      if (response.products) {
        setProducts(response.products);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await deleteProduct(token, id);
        
        if (response.success !== false) {
          fetchProducts(pagination.currentPage);
        } else {
          alert('Failed to delete product: ' + response.message);
        }
      } catch (error) {
        alert('Failed to delete product: ' + error.message);
      }
    }
  };

  // Bulk delete handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeleting(true);
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Delete products one by one
    for (const productId of selectedProducts) {
      try {
        const response = await deleteProduct(token, productId);
        if (response.success !== false) {
          successCount++;
        } else {
          failCount++;
          errors.push(`Product ${productId}: ${response.message}`);
        }
      } catch (error) {
        failCount++;
        errors.push(`Product ${productId}: ${error.message}`);
      }
    }

    setDeleting(false);

    // Show results
    let message = `Bulk delete completed!\n`;
    if (successCount > 0) message += `✓ ${successCount} products deleted successfully\n`;
    if (failCount > 0) {
      message += `✗ ${failCount} products failed to delete\n`;
      if (errors.length > 0) {
        message += `\nErrors:\n${errors.join('\n')}`;
      }
    }

    alert(message);

    // Reset selection and refresh
    setSelectedProducts([]);
    setSelectAll(false);
    fetchProducts(pagination.currentPage);
  };

  const handlePageChange = (page) => {
    fetchProducts(page);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      inStock: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setTimeout(() => fetchProducts(1), 0);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setImportError('Please select a CSV file');
        return;
      }
      setImportFile(file);
      setImportError(null);
      setImportResult(null);
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      setImportError('Please select a file');
      return;
    }

    if (!importFile.name.endsWith('.csv')) {
      setImportError('Please select a CSV file');
      return;
    }

    if (importFile.size > 5 * 1024 * 1024) {
      setImportError('File size must be less than 5MB');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const response = await bulkImportProducts(token, importFile, importOptions);
      
      if (response.results && response.results.success !== false) {
        setImportResult(response.results);
        
        const { imported, updated, skipped, errors } = response.results;
        let message = `Import completed successfully!\n`;
        if (imported > 0) message += `✓ ${imported} products created\n`;
        if (updated > 0) message += `✓ ${updated} products updated\n`;
        if (skipped?.length > 0) message += `⚠ ${skipped.length} products skipped\n`;
        if (errors?.length > 0) message += `✗ ${errors.length} errors occurred\n`;
        
        alert(message);
        
        fetchProducts(1);
        
        if (!errors || errors.length === 0) {
          setTimeout(() => {
            setShowImportModal(false);
            setImportFile(null);
            setImportResult(null);
          }, 3000);
        }
      } else {
        setImportError(response.message || 'Import failed');
      }
    } catch (error) {
      setImportError('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadFullTemplate = async () => {
    try {
      const blob = await downloadSampleCSV(token);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products-sample.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Failed to download template: ' + error.message);
    }
  };

  const downloadUpdateTemplate = async () => {
    try {
      const blob = await downloadUpdateSampleCSV(token);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products-update-sample.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Failed to download template: ' + error.message);
    }
  };

  if (loading && products.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50"
          >
            Bulk Import
          </button>
          <Link
            to="/dashboard/products/new"
            className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-indigo-900">
              {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => {
                setSelectedProducts([]);
                setSelectAll(false);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 underline"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
              </>
            )}
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
                  placeholder="Product name or SKU"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                <select
                  name="inStock"
                  value={filters.inStock}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All</option>
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="stockQuantity">Stock</option>
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

      {pagination.totalProducts !== undefined && (
        <div className="mb-4 text-gray-600">
          Showing {products.length} of {pagination.totalProducts} products
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </th>
                <th className="py-3 px-6 text-left">Image</th>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">SKU</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-center">Price</th>
                <th className="py-3 px-6 text-center">Stock</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {products.map((product) => (
                <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleSelectProduct(product._id)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                  </td>
                  <td className="py-3 px-6">
                    <img
                      src={product.images?.[0] || '/placeholder-product.png'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="py-3 px-6 text-left whitespace-nowrap font-medium">
                    {product.name}
                  </td>
                  <td className="py-3 px-6 text-left">{product.sku}</td>
                  <td className="py-3 px-6 text-left">{product.category?.name || 'N/A'}</td>
                  <td className="py-3 px-6 text-center">
                    ${product.price.toFixed(2)}
                    {product.salePrice && (
                      <div className="text-xs text-green-600">
                        Sale: ${product.salePrice.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">{product.stockQuantity}</td>
                  <td className="py-3 px-6 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center gap-2">
                      <Link
                        to={`/dashboard/products/edit/${product._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No products found. Try adjusting your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
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
                  onClick={() => handlePageChange(page)}
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
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Bulk Import Products</h2>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Upload a CSV file to import or update multiple products at once.
              </p>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={downloadFullTemplate}
                    className="flex-1 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium"
                  >
                    📥 Download Full Template
                  </button>
                  <button
                    onClick={downloadUpdateTemplate}
                    className="flex-1 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 text-sm font-medium"
                  >
                    📥 Download Update Template
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Full template: For creating new products<br/>
                  Update template: For updating stock, prices, or status
                </p>
              </div>
            </div>

            {/* Import Options */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Import Options</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="updateExisting"
                    checked={importOptions.updateExisting}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      updateExisting: e.target.checked
                    }))}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="updateExisting" className="ml-2 text-sm text-gray-700">
                    Update existing products (by SKU)
                  </label>
                </div>
                
                {importOptions.updateExisting && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fields to Update (leave 'all' to update all fields)
                    </label>
                    <input
                      type="text"
                      value={importOptions.fieldsToUpdate}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        fieldsToUpdate: e.target.value
                      }))}
                      placeholder="all or stockQuantity,price,inStock"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Examples: stockQuantity,inStock | price,salePrice | isActive,featured
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportFile}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {importFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {importError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">Error:</p>
                <p className="text-red-600 text-sm">{importError}</p>
              </div>
            )}

            {importResult && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-semibold text-blue-900 mb-2">Import Results:</p>
                <div className="space-y-1 text-sm">
                  {importResult.imported > 0 && (
                    <p className="text-green-700">✓ Created: {importResult.imported} products</p>
                  )}
                  {importResult.updated > 0 && (
                    <p className="text-blue-700">✓ Updated: {importResult.updated} products</p>
                  )}
                  {importResult.skipped?.length > 0 && (
                    <details className="text-yellow-700">
                      <summary className="cursor-pointer">
                        ⚠ Skipped: {importResult.skipped.length} products
                      </summary>
                      <ul className="ml-4 mt-2 space-y-1">
                        {importResult.skipped.map((skip, idx) => (
                          <li key={idx}>Row {skip.row} - {skip.sku}: {skip.reason}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {importResult.errors?.length > 0 && (
                    <details className="text-red-700">
                      <summary className="cursor-pointer">
                        ✗ Errors: {importResult.errors.length} products
                      </summary>
                      <ul className="ml-4 mt-2 space-y-1">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>Row {err.row} - {err.sku}: {err.error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleBulkImport}
                disabled={!importFile || importing}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import CSV'}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportError(null);
                  setImportResult(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;