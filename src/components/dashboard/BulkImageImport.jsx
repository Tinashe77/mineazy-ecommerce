import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { bulkUploadImages } from '../../services/products';
import { getCategories } from '../../services/categories';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

// Fuzzy matching function - calculates similarity between two strings
const fuzzyMatch = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 100;

  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 80;

  // Calculate Levenshtein distance for similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  const editDistance = levenshteinDistance(longer, shorter);
  const similarity = ((longer.length - editDistance) / longer.length) * 100;

  return Math.round(similarity);
};

// Levenshtein distance algorithm
const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

const BulkImageImport = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useContext(AuthContext);

  // State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imageMatches, setImageMatches] = useState({}); // { filename: { products: [{ id, name, sku }], confidence, isManual, matchMethod } }
  const [unmatched, setUnmatched] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [dragActive, setDragActive] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategory) {
      const filtered = products.filter(p => p.category?._id === selectedCategory);
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [selectedCategory, products]);

  const fetchCategories = async () => {
    const response = await getCategories({});
    if (response.categories) {
      setCategories(response.categories);
    }
  };

  const fetchProductsByCategory = async (categoryId) => {
    setLoading(true);
    try {
      const { getProducts } = await import('../../services/products');
      const response = await getProducts({ category: categoryId, limit: 1000 });
      if (response.products) {
        setProducts(response.products);
        setFilteredProducts(response.products);
      }
    } catch (err) {
      setError('Failed to load products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    if (categoryId) {
      fetchProductsByCategory(categoryId);
    } else {
      setProducts([]);
      setFilteredProducts([]);
    }
    // Reset matches when category changes
    setImageMatches({});
    setUnmatched([]);
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
    // Filter only allowed image files
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
      setError('No valid image files selected. Only JPEG, PNG, GIF, WebP, and AVIF are allowed.');
      return;
    }

    if (!selectedCategory) {
      setError('Please select a category first');
      return;
    }

    if (filteredProducts.length === 0) {
      setError('No products found in selected category');
      return;
    }

    if (invalidFiles.length > 0) {
      setError(`Skipped ${invalidFiles.length} invalid file(s). Only JPEG, PNG, GIF, WebP, and AVIF are allowed.`);
    } else {
      setError(null);
    }

    setUploadedFiles(validFiles);
    performAutoMatching(validFiles);
  };

  // Convert product name to filename format (reverse of CSV import)
  // Example: "ROUND BAR 18MM*3M" -> "ROUND-BAR-18MMx3M"
  // Handles: * -> x, spaces -> dashes
  const productNameToFilename = (productName) => {
    return productName
      .trim()
      .replace(/\*/g, 'x')   // Normalize * to x (for filenames)
      .replace(/\s+/g, '-')  // Replace spaces with dashes
      .toUpperCase();
  };

  const createMatchRecord = (productList = [], options = {}) => {
    const seen = new Set();
    const productsForRecord = [];

    productList.forEach(product => {
      if (!product || !product._id || seen.has(product._id)) {
        return;
      }

      productsForRecord.push({
        id: product._id,
        name: product.name,
        sku: product.sku,
      });

      seen.add(product._id);
    });

    if (productsForRecord.length === 0) {
      return null;
    }

    return {
      products: productsForRecord,
      confidence: options.confidence ?? 100,
      isManual: options.isManual ?? false,
      matchMethod: options.matchMethod || (options.isManual ? 'manual' : 'auto'),
    };
  };

  const resolveProductsByIds = (ids = []) => {
    if (!Array.isArray(ids)) {
      return [];
    }

    const allProductsMap = new Map();

    filteredProducts.forEach(product => {
      allProductsMap.set(product._id, product);
    });

    products.forEach(product => {
      if (!allProductsMap.has(product._id)) {
        allProductsMap.set(product._id, product);
      }
    });

    const resolved = [];
    const seenIds = new Set();

    ids.forEach(id => {
      if (!id || seenIds.has(id)) return;
      const product = allProductsMap.get(id);
      if (product) {
        resolved.push(product);
        seenIds.add(id);
      }
    });

    return resolved;
  };

  const setMatchForFile = (filename, matchRecord) => {
    setImageMatches(prev => {
      const next = { ...prev };
      if (matchRecord) {
        next[filename] = matchRecord;
      } else {
        delete next[filename];
      }
      return next;
    });

    setUnmatched(prev => {
      if (matchRecord) {
        return prev.filter(f => f !== filename);
      }
      return prev.includes(filename) ? prev : [...prev, filename];
    });
  };

  const handleManualMatch = (filename, productIds = []) => {
    const resolvedProducts = resolveProductsByIds(productIds);
    const matchRecord = createMatchRecord(resolvedProducts, {
      isManual: true,
      confidence: 100,
      matchMethod: 'manual',
    });

    setMatchForFile(filename, matchRecord);
  };

  const performAutoMatching = (files) => {
    const matches = {};
    const unmatchedFiles = [];

    files.forEach(file => {
      const filename = file.name;
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, ""); // Remove extension

      let bestMatch = null;
      let bestScore = 0;
      let matchMethod = '';

      filteredProducts.forEach(product => {
        // Method 1: Check if product has this exact image path in its images array
        if (product.images && product.images.length > 0) {
          const hasMatchingImage = product.images.some(imagePath => {
            // Extract just the filename from path
            const imageFilename = imagePath.split(/[\/\\]/).pop();
            return imageFilename.toLowerCase() === filename.toLowerCase();
          });

          if (hasMatchingImage) {
            bestMatch = product;
            bestScore = 100;
            matchMethod = 'exact-path';
            return; // Exit early on exact path match
          }
        }

        // Method 2: Convert product name to filename format
        const productAsFilename = productNameToFilename(product.name);

        // Try exact filename match (case-insensitive)
        if (nameWithoutExt.toUpperCase() === productAsFilename) {
          if (bestScore < 95) { // Path match is better
            bestMatch = product;
            bestScore = 95;
            matchMethod = 'exact-name';
          }
        } else {
          // Method 3: Fall back to fuzzy matching
          const fuzzyScore = fuzzyMatch(nameWithoutExt, product.name);
          const filenameScore = fuzzyMatch(nameWithoutExt, productAsFilename);
          const score = Math.max(fuzzyScore, filenameScore);

          if (score > bestScore) {
            bestScore = score;
            bestMatch = product;
            matchMethod = 'fuzzy';
          }
        }
      });

      if (bestMatch && bestScore >= 60) {
        const matchRecord = createMatchRecord([bestMatch], {
          confidence: bestScore,
          isManual: false,
          matchMethod,
        });

        if (matchRecord) {
          matches[filename] = matchRecord;
          return;
        }
      }

      if (!unmatchedFiles.includes(filename)) {
        unmatchedFiles.push(filename);
      }
    });

    setImageMatches(matches);
    setUnmatched(unmatchedFiles);
  };

  const handleProductSelectChange = (filename, event) => {
    const selectedIds = Array.from(event.target.selectedOptions, option => option.value);
    handleManualMatch(filename, selectedIds);
  };

  const formatProductLabel = (product) => {
    if (!product) return '';
    return product.sku ? `${product.name} (${product.sku})` : product.name;
  };

  const describeMatch = (match) => {
    if (!match) return '';

    if (match.isManual || match.matchMethod === 'manual') {
      const count = match.products?.length || 0;
      return count > 1
        ? `👤 Manual selection • ${count} products`
        : '👤 Manual selection';
    }

    let methodLabel = 'auto-match';
    switch (match.matchMethod) {
      case 'exact-path':
        methodLabel = 'existing image match';
        break;
      case 'exact-name':
        methodLabel = 'filename match';
        break;
      case 'fuzzy':
        methodLabel = 'fuzzy match';
        break;
      default:
        methodLabel = match.matchMethod || 'auto-match';
    }

    return `🤖 Auto (${match.confidence}% • ${methodLabel})`;
  };

  // Search and autocomplete state
  const [searchInputs, setSearchInputs] = useState({}); // { filename: searchText }
  const [showDropdown, setShowDropdown] = useState({}); // { filename: boolean }
  const [highlightedIndex, setHighlightedIndex] = useState({}); // { filename: number }

  const getSearchResults = (filename) => {
    const searchText = searchInputs[filename] || '';
    if (!searchText.trim()) return [];

    const search = searchText.toLowerCase();
    return filteredProducts.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const sku = product.sku?.toLowerCase() || '';
      return name.includes(search) || sku.includes(search);
    }).slice(0, 10); // Limit to 10 results
  };

  const handleSearchInputChange = (filename, value) => {
    setSearchInputs(prev => ({ ...prev, [filename]: value }));
    setShowDropdown(prev => ({ ...prev, [filename]: value.trim().length > 0 }));
    setHighlightedIndex(prev => ({ ...prev, [filename]: 0 }));
  };

  const handleSearchKeyDown = (filename, event, selectedIds = []) => {
    const results = getSearchResults(filename);
    const currentIndex = highlightedIndex[filename] || 0;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(prev => ({
        ...prev,
        [filename]: Math.min(currentIndex + 1, results.length - 1)
      }));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(prev => ({
        ...prev,
        [filename]: Math.max(currentIndex - 1, 0)
      }));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results.length > 0) {
        const product = results[currentIndex];
        if (product && !selectedIds.includes(product._id)) {
          handleAddProduct(filename, product._id, selectedIds);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setShowDropdown(prev => ({ ...prev, [filename]: false }));
    }
  };

  const handleAddProduct = (filename, productId, currentSelectedIds = []) => {
    if (!currentSelectedIds.includes(productId)) {
      const newSelectedIds = [...currentSelectedIds, productId];
      handleManualMatch(filename, newSelectedIds);
    }
    // Clear search input
    setSearchInputs(prev => ({ ...prev, [filename]: '' }));
    setShowDropdown(prev => ({ ...prev, [filename]: false }));
    setHighlightedIndex(prev => ({ ...prev, [filename]: 0 }));
  };

  const handleRemoveProduct = (filename, productId, currentSelectedIds = []) => {
    const newSelectedIds = currentSelectedIds.filter(id => id !== productId);
    if (newSelectedIds.length > 0) {
      handleManualMatch(filename, newSelectedIds);
    } else {
      handleRemoveMatch(filename);
    }
  };

  const renderProductSelect = (filename, selectedIds = []) => {
    const searchResults = getSearchResults(filename);
    const isDropdownVisible = showDropdown[filename] && searchResults.length > 0;
    const searchValue = searchInputs[filename] || '';
    const currentHighlightedIndex = highlightedIndex[filename] || 0;

    // Get selected products
    const selectedProducts = selectedIds
      .map(id => filteredProducts.find(p => p._id === id))
      .filter(Boolean);

    return (
      <div className="mt-3">
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Search and assign products
        </label>

        {/* Selected products as pills */}
        {selectedProducts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            {selectedProducts.map(product => (
              <span
                key={product._id}
                className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                <span className="max-w-[200px] truncate">
                  {formatProductLabel(product)}
                </span>
                <button
                  onClick={() => handleRemoveProduct(filename, product._id, selectedIds)}
                  className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                  type="button"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input with autocomplete */}
        <div className="relative">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchInputChange(filename, e.target.value)}
            onKeyDown={(e) => handleSearchKeyDown(filename, e, selectedIds)}
            onFocus={() => {
              if (searchValue.trim()) {
                setShowDropdown(prev => ({ ...prev, [filename]: true }));
              }
            }}
            onBlur={() => {
              // Delay to allow click events on dropdown items to fire first
              setTimeout(() => {
                setShowDropdown(prev => ({ ...prev, [filename]: false }));
              }, 200);
            }}
            placeholder="Type to search products..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={filteredProducts.length === 0}
          />

          {/* Autocomplete dropdown */}
          {isDropdownVisible && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((product, index) => {
                const isSelected = selectedIds.includes(product._id);
                const isHighlighted = index === currentHighlightedIndex;

                return (
                  <button
                    key={product._id}
                    type="button"
                    onMouseDown={(e) => {
                      // Use onMouseDown instead of onClick to fire before onBlur
                      e.preventDefault();
                      if (!isSelected) {
                        handleAddProduct(filename, product._id, selectedIds);
                      }
                    }}
                    disabled={isSelected}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isHighlighted
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="font-medium">{product.name}</div>
                    {product.sku && (
                      <div className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</div>
                    )}
                    {isSelected && (
                      <div className="text-xs text-gray-500 mt-0.5">Already selected</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-1">
          Type to search, then press Enter or click to add. Press Escape to close.
        </p>
      </div>
    );
  };

  const handleRemoveMatch = (filename) => {
    setMatchForFile(filename, null);
  };

  const handleUpload = async () => {
    const hasValidMatch = Object.values(imageMatches).some(
      match => Array.isArray(match?.products) && match.products.length > 0
    );

    if (!hasValidMatch) {
      setError('Please match at least one image to a product');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Build mapping object using arrays of product IDs
      const mapping = {};
      Object.entries(imageMatches).forEach(([filename, match]) => {
        const productIds = Array.isArray(match?.products)
          ? match.products.map(product => product.id).filter(Boolean)
          : [];

        if (productIds.length > 0) {
          mapping[filename] = productIds;
        }
      });

      if (Object.keys(mapping).length === 0) {
        setError('Please match at least one image to a product');
        setUploading(false);
        return;
      }

      // Filter files to only include matched ones
      const filesToUpload = uploadedFiles.filter(file => {
        const mapped = mapping[file.name];
        return Array.isArray(mapped) && mapped.length > 0;
      });

      if (filesToUpload.length === 0) {
        setError('No matched files found. Please re-select your images and try again.');
        setUploading(false);
        return;
      }

      const response = await bulkUploadImages(token, filesToUpload, mapping);

      if (response.success) {
        setResult(response);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setUploadedFiles([]);
    setImageMatches({});
    setUnmatched([]);
    setResult(null);
    setError(null);
    setSelectedCategory('');
    setProducts([]);
    setFilteredProducts([]);
    // Clear search state
    setSearchInputs({});
    setShowDropdown({});
    setHighlightedIndex({});
    onClose();
  };

  if (!isOpen) return null;

  const matchedCount = Object.values(imageMatches).filter(
    match => Array.isArray(match?.products) && match.products.length > 0
  ).length;
  const totalAssignmentsSelected = Object.values(imageMatches).reduce((sum, match) => {
    if (!Array.isArray(match?.products)) {
      return sum;
    }
    return sum + match.products.filter(product => Boolean(product?.id)).length;
  }, 0);
  const totalFiles = uploadedFiles.length;
  const productNameById = {};

  if (result?.productsUpdated) {
    result.productsUpdated.forEach(productUpdate => {
      if (productUpdate?.productId) {
        productNameById[productUpdate.productId] = productUpdate.productName;
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Image Upload</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Step 1: Select Category
          </label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Select a category --</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          {selectedCategory && (
            <p className="mt-2 text-sm text-gray-600">
              {filteredProducts.length} products found in this category
            </p>
          )}
        </div>

        {/* Drag and Drop Zone */}
        {selectedCategory && filteredProducts.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 2: Upload Images
            </label>
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

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-900 text-base">✅ Bulk image upload complete</p>
              <div className="mt-2 text-sm text-green-800 space-y-1">
                <p>
                  • {result.uploaded ?? 0} product assignment{(result.uploaded ?? 0) === 1 ? '' : 's'} processed
                </p>
                <p>
                  • {(result.fileMappings?.length ?? 0)} file{(result.fileMappings?.length ?? 0) === 1 ? '' : 's'} stored on Cloudinary
                </p>
                <p>
                  • {(result.productsUpdated?.length ?? 0)} product{(result.productsUpdated?.length ?? 0) === 1 ? '' : 's'} updated
                </p>
                {result.failed > 0 && (
                  <p className="text-red-700">
                    • {result.failed} assignment{result.failed === 1 ? '' : 's'} failed
                  </p>
                )}
              </div>
            </div>

            {Array.isArray(result.errors) && result.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Needs attention</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {result.errors.map((err, index) => {
                    if (typeof err === 'string') {
                      return <li key={`error-${index}`}>{err}</li>;
                    }
                    const fileName = err?.fileName || err?.filename || err?.originalName || 'Image';
                    const reason = err?.message || err?.reason || 'Unknown error';
                    return (
                      <li key={`error-${index}`}>
                        <span className="font-medium">{fileName}:</span> {reason}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-red-600 mt-2">
                  Adjust the mapping for these files and re-upload to retry.
                </p>
              </div>
            )}

            {Array.isArray(result.fileMappings) && result.fileMappings.length > 0 && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Stored on Cloudinary</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {result.fileMappings.map((mapping, index) => {
                    const productIds = mapping?.productIds || [];
                    const cloudinaryUrl = mapping?.absoluteUrl || mapping?.storedUrl;
                    return (
                      <div
                        key={`mapping-${index}`}
                        className="border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 break-all">{mapping.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {productIds.length} product{productIds.length === 1 ? '' : 's'}
                          </p>
                          {productIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {productIds.map((id, productIndex) => {
                                const label = productNameById[id] || id;
                                return (
                                  <span
                                    key={`mapping-${index}-product-${id}-${productIndex}`}
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                                  >
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {cloudinaryUrl && (
                          <a
                            href={cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            View image
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {Array.isArray(result.productsUpdated) && result.productsUpdated.length > 0 && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Products updated</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {result.productsUpdated.map((product) => {
                    const imagesAddedCount = product.imagesAdded ?? (product.imageDetails?.length ?? 0);
                    const totalImagesCount = product.totalImages ?? '-';

                    return (
                      <details
                        key={product.productId}
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <summary className="cursor-pointer text-sm font-medium text-gray-800">
                          {product.productName || product.productId}{' '}
                          <span className="text-xs text-gray-500">
                            (+{imagesAddedCount} image{imagesAddedCount === 1 ? '' : 's'} • total {totalImagesCount})
                          </span>
                        </summary>
                        {Array.isArray(product.imageDetails) && product.imageDetails.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {product.imageDetails.map((detail, imageIndex) => {
                              const imageUrl = detail?.absoluteUrl || detail?.storedUrl;
                              if (!imageUrl) return null;
                              return (
                                <a
                                  key={`${product.productId}-${imageIndex}`}
                                  href={imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-400"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`${product.productName || product.productId} preview ${imageIndex + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </details>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review Matches */}
        {uploadedFiles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-700">
                Step 3: Review & Match{' '}
                {totalFiles > 0 && (
                  <span className="font-normal text-gray-600">
                    ({matchedCount}/{totalFiles} images matched • {totalAssignmentsSelected} assignments)
                  </span>
                )}
              </label>
              <span className={`text-sm font-semibold ${
                unmatched.length > 0 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {unmatched.length} unmatched
              </span>
            </div>

            {/* Matched Images */}
            {Object.entries(imageMatches).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">✓ Matched Images</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(imageMatches)
                    .filter(([, match]) => Array.isArray(match?.products) && match.products.length > 0)
                    .map(([filename, match]) => {
                      const file = uploadedFiles.find(f => f.name === filename);
                      const preview = file ? URL.createObjectURL(file) : null;
                      const selectedProducts = match.products || [];
                      const selectedIds = selectedProducts.map(product => product.id);

                      return (
                        <div
                          key={filename}
                          className="flex flex-col sm:flex-row gap-4 p-4 bg-green-50 border border-green-200 rounded-lg"
                        >
                          {preview && (
                            <img
                              src={preview}
                              alt={filename}
                              className="w-20 h-20 object-cover rounded shadow-sm"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 break-all">{filename}</p>
                            <p className="text-xs text-gray-600 mt-1">{describeMatch(match)}</p>

                            {selectedProducts.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {selectedProducts.map(product => (
                                  <span
                                    key={product.id}
                                    className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                                  >
                                    <span className="truncate max-w-[12rem]">{product.name}</span>
                                    {product.sku && (
                                      <span className="text-[10px] text-green-700 uppercase tracking-wide">
                                        SKU {product.sku}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}

                            {renderProductSelect(filename, selectedIds)}
                          </div>
                          <div className="flex sm:flex-col gap-2 sm:items-end">
                            <button
                              onClick={() => handleRemoveMatch(filename)}
                              className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Clear
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Unmatched Images */}
            {unmatched.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">⚠️ Unmatched Images - Manual Matching Required</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {unmatched.map(filename => {
                    const file = uploadedFiles.find(f => f.name === filename);
                    const preview = file ? URL.createObjectURL(file) : null;

                    return (
                      <div
                        key={filename}
                        className="flex flex-col sm:flex-row gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        {preview && (
                          <img
                            src={preview}
                            alt={filename}
                            className="w-20 h-20 object-cover rounded shadow-sm"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 break-all">{filename}</p>
                          <p className="text-xs text-yellow-800 mt-1">
                            Select one or more products to assign this image.
                          </p>

                          {renderProductSelect(filename, [])}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || matchedCount === 0 || loading}
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
                Upload {matchedCount} Image{matchedCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImageImport;
