import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { bulkUploadImages } from '../../services/products';
import { getCategories } from '../../services/categories';

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
  const [imageMatches, setImageMatches] = useState({}); // { filename: { productId, confidence, productName } }
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
    // Filter only image files
    const imageFiles = files.filter(file =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      setError('No valid image files selected');
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

    setUploadedFiles(imageFiles);
    performAutoMatching(imageFiles);
    setError(null);
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

      // Only auto-match if confidence is above 60%
      if (bestMatch && bestScore >= 60) {
        matches[filename] = {
          productId: bestMatch._id,
          productName: bestMatch.name,
          confidence: bestScore,
          isManual: false,
          matchMethod: matchMethod
        };
      } else {
        unmatchedFiles.push(filename);
      }
    });

    setImageMatches(matches);
    setUnmatched(unmatchedFiles);
  };

  const handleManualMatch = (filename, productId) => {
    const product = filteredProducts.find(p => p._id === productId);
    if (!product) return;

    setImageMatches(prev => ({
      ...prev,
      [filename]: {
        productId: product._id,
        productName: product.name,
        confidence: 100,
        isManual: true
      }
    }));

    setUnmatched(prev => prev.filter(f => f !== filename));
  };

  const handleRemoveMatch = (filename) => {
    setImageMatches(prev => {
      const newMatches = { ...prev };
      delete newMatches[filename];
      return newMatches;
    });

    if (!unmatched.includes(filename)) {
      setUnmatched(prev => [...prev, filename]);
    }
  };

  const handleUpload = async () => {
    if (Object.keys(imageMatches).length === 0) {
      setError('Please match at least one image to a product');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Build mapping object
      const mapping = {};
      Object.entries(imageMatches).forEach(([filename, match]) => {
        mapping[filename] = match.productId;
      });

      // Filter files to only include matched ones
      const filesToUpload = uploadedFiles.filter(file =>
        mapping[file.name] !== undefined
      );

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
    onClose();
  };

  if (!isOpen) return null;

  const matchedCount = Object.keys(imageMatches).length;
  const totalFiles = uploadedFiles.length;

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
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supported: JPG, PNG, GIF, WebP (max 5MB each)
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
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-semibold text-green-900 mb-2">✅ Upload Complete!</p>
            <div className="text-sm text-green-700 space-y-1">
              <p>• {result.uploaded} images uploaded successfully</p>
              <p>• {result.productsUpdated?.length} products updated</p>
              {result.failed > 0 && (
                <p className="text-red-700">• {result.failed} images failed</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review Matches */}
        {uploadedFiles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                Step 3: Review & Match ({matchedCount}/{totalFiles} matched)
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
                  {Object.entries(imageMatches).map(([filename, match]) => {
                    const file = uploadedFiles.find(f => f.name === filename);
                    const preview = file ? URL.createObjectURL(file) : null;

                    return (
                      <div key={filename} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        {preview && (
                          <img src={preview} alt={filename} className="w-16 h-16 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                          <p className="text-sm text-gray-600">→ {match.productName}</p>
                          <p className="text-xs text-gray-500">
                            {match.isManual ? '👤 Manual' : `🤖 Auto (${match.confidence}% confidence)`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveMatch(filename)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
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
                      <div key={filename} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        {preview && (
                          <img src={preview} alt={filename} className="w-16 h-16 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-2">{filename}</p>
                          <select
                            onChange={(e) => handleManualMatch(filename, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">-- Select product --</option>
                            {filteredProducts.map(product => (
                              <option key={product._id} value={product._id}>
                                {product.name} ({product.sku})
                              </option>
                            ))}
                          </select>
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
