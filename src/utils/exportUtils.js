/**
 * Utility functions for exporting data
 */

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename to use
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Export products to CSV with optional filters
 * @param {Object} options - Export options
 * @param {string} options.token - JWT authentication token
 * @param {Object} options.filters - Filter parameters
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 * @param {Function} options.onStart - Start callback
 * @returns {Promise<{success: boolean, totalProducts: number, filename: string}>}
 */
export const exportProductsToCSV = async (options = {}) => {
  const { token, filters = {}, onSuccess, onError, onStart } = options;

  try {
    if (onStart) onStart();

    // Dynamically import to avoid circular dependencies
    const { exportProducts } = await import('../services/products');

    // Call export API
    const result = await exportProducts(token, filters);

    // Download the file
    downloadBlob(result.blob, result.filename);

    // Call success callback
    if (onSuccess) {
      onSuccess({
        totalProducts: result.totalProducts,
        filename: result.filename,
      });
    }

    return {
      success: true,
      totalProducts: result.totalProducts,
      filename: result.filename,
    };
  } catch (error) {
    console.error('Export error:', error);

    // Call error callback
    if (onError) {
      onError(error);
    }

    return {
      success: false,
      error: error.message || 'Failed to export products',
    };
  }
};

/**
 * Quick export presets
 */
export const exportPresets = {
  // Export all products with all fields
  all: {
    name: 'All Products',
    filters: {},
  },

  // Export basic product info
  basic: {
    name: 'Basic Info',
    filters: {
      fields: 'sku,name,price,stockQuantity,inStock',
    },
  },

  // Export products with images
  withImages: {
    name: 'Products with Images',
    filters: {
      fields: 'sku,name,price,images',
    },
  },

  // Export in-stock products
  inStock: {
    name: 'In Stock Products',
    filters: {
      inStock: 'true',
      fields: 'sku,name,price,stockQuantity',
    },
  },

  // Export out-of-stock products for restocking
  outOfStock: {
    name: 'Out of Stock Products',
    filters: {
      inStock: 'false',
      fields: 'sku,name,stockQuantity,category',
    },
  },

  // Export featured products
  featured: {
    name: 'Featured Products',
    filters: {
      featured: 'true',
    },
  },

  // Export for price updates
  pricing: {
    name: 'Pricing Information',
    filters: {
      fields: 'sku,name,price,salePrice,category',
    },
  },

  // Export for inventory audit
  inventory: {
    name: 'Inventory Audit',
    filters: {
      fields: 'sku,name,stockQuantity,inStock,weight,dimensions',
    },
  },
};

/**
 * Export using a preset
 * @param {string} presetName - Name of the preset
 * @param {string} token - JWT token
 * @param {Object} additionalFilters - Additional filters to merge
 * @returns {Promise}
 */
export const exportWithPreset = async (presetName, token, additionalFilters = {}) => {
  const preset = exportPresets[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  const filters = { ...preset.filters, ...additionalFilters };

  return exportProductsToCSV({ token, filters });
};
