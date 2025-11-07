// src/services/products.js - COMPLETE FIX
const API_BASE_URL = 'https://mining-equipment-backend.onrender.com';

const API_URL = `${API_BASE_URL}/api/products`;
const SEARCH_URL = `${API_BASE_URL}/api/search`;

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

export const getProducts = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getProductById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getRelatedProducts = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}/related`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const searchProducts = async (query, params = {}) => {
  try {
    const allParams = { q: query, ...params };
    const queryString = new URLSearchParams(allParams).toString();
    const response = await fetch(`${API_URL}/search?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getSearchSuggestions = async (query) => {
  try {
    const response = await fetch(`${SEARCH_URL}/suggestions?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// FIXED: Proper FormData handling - DO NOT set Content-Type header
export const createProduct = async (token, productData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // DO NOT set Content-Type - browser will set it with boundary for FormData
      },
      body: productData, // FormData object
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// FIXED: Proper FormData handling - DO NOT set Content-Type header
export const updateProduct = async (token, id, productData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // DO NOT set Content-Type - browser will set it with boundary for FormData
      },
      body: productData, // FormData object
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteProduct = async (token, id, options = {}) => {
  try {
    const requestInit = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const forceSuffix = options.force ? '?force=true' : '';
    const response = await fetch(`${API_URL}/${id}${forceSuffix}`, requestInit);
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Bulk import products from CSV file
 * @param {string} token - Authentication token
 * @param {File} csvFile - CSV file to import
 * @param {Object} options - Import options
 * @param {boolean} options.updateExisting - Whether to update existing products (default: true)
 * @param {string} options.fieldsToUpdate - Comma-separated list of fields to update (default: 'all')
 * @returns {Promise<Object>} Import results
 */
export const bulkImportProducts = async (token, csvFile, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('csv', csvFile); // Field name MUST be 'csv' per API docs
    
    // Add import options as per API documentation
    if (options.updateExisting !== undefined) {
      formData.append('updateExisting', options.updateExisting.toString());
    }
    
    if (options.fieldsToUpdate && options.fieldsToUpdate !== 'all') {
      formData.append('fieldsToUpdate', options.fieldsToUpdate);
    }
    
    const response = await fetch(`${API_URL}/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // CRITICAL: NO Content-Type header for FormData!
        // Browser will automatically set multipart/form-data with boundary
      },
      body: formData,
    });
    
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Get import template information
 * Returns field definitions, validation rules, and examples
 */
export const getImportTemplate = async (token) => {
  try {
    const response = await fetch(`${API_URL}/import/template`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Failed to get template info:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Download full sample CSV for creating new products
 * Contains all fields with sample data
 */
export const downloadSampleCSV = async (token) => {
  try {
    const response = await fetch(`${API_URL}/import/sample`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download sample CSV');
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Failed to download sample CSV:', error);
    return null;
  }
};

/**
 * Download update sample CSV
 * Contains only SKU and common update fields (stock, price, status)
 */
export const downloadUpdateSampleCSV = async (token) => {
  try {
    const response = await fetch(`${API_URL}/import/sample-update`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download update sample CSV');
    }

    return await response.blob();
  } catch (error) {
    console.error('Failed to download update sample CSV:', error);
    return null;
  }
};

/**
 * Bulk upload images and assign to products
 * @param {string} token - Authentication token
 * @param {Array<File>} imageFiles - Array of image files
 * @param {Object} mapping - Mapping of filename to product ID { "filename.jpg": "productId" }
 * @returns {Promise<Object>} Upload results
 */
export const bulkUploadImages = async (token, imageFiles, mapping) => {
  try {
    const formData = new FormData();

    // Append all image files
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    // Append mapping data as JSON string
    formData.append('mapping', JSON.stringify(mapping));

    const response = await fetch(`${API_URL}/bulk-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO Content-Type header - browser sets it automatically with boundary
      },
      body: formData,
    });

    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Get products without images
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} List of products without images
 */
export const getProductsWithoutImages = async (token) => {
  try {
    const response = await fetch(`${API_URL}/without-images`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Upload placeholder image
 * @param {string} token - Authentication token
 * @param {File} imageFile - Image file to upload
 * @returns {Promise<Object>} Upload result with placeholder URL
 */
export const uploadPlaceholderImage = async (token, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_URL}/placeholder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO Content-Type header - browser sets it automatically with boundary
      },
      body: formData,
    });

    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Use existing media library image as placeholder
 * @param {string} token - Authentication token
 * @param {string} mediaUrl - URL of existing media in library
 * @returns {Promise<Object>} Result with placeholder URL
 */
export const useExistingMediaAsPlaceholder = async (token, mediaUrl) => {
  try {
    const response = await fetch(`${API_URL}/placeholder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ existingMediaUrl: mediaUrl }),
    });

    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Use external image URL as placeholder
 * @param {string} token - Authentication token
 * @param {string} externalUrl - External image URL
 * @returns {Promise<Object>} Result with placeholder URL
 */
export const useExternalUrlAsPlaceholder = async (token, externalUrl) => {
  try {
    const response = await fetch(`${API_URL}/placeholder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ externalImageUrl: externalUrl }),
    });

    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Apply placeholder image to all products without images
 * @param {string} token - Authentication token
 * @param {string} placeholderUrl - URL of placeholder image
 * @returns {Promise<Object>} Result with count of updated products
 */
export const applyPlaceholderToProducts = async (token, placeholderUrl) => {
  try {
    const response = await fetch(`${API_URL}/apply-placeholder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ placeholderUrl }),
    });

    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Export products to CSV file
 * @param {string} token - Authentication token
 * @param {Object} filters - Export filters
 * @param {string} filters.category - Filter by category ID
 * @param {boolean} filters.inStock - Filter by stock availability
 * @param {boolean} filters.featured - Filter by featured status
 * @param {boolean} filters.isActive - Filter by active status
 * @param {number} filters.minPrice - Minimum price filter
 * @param {number} filters.maxPrice - Maximum price filter
 * @param {string} filters.fields - Comma-separated list of fields to export
 * @returns {Promise<Blob>} CSV file blob
 */
export const exportProducts = async (token, filters = {}) => {
  try {
    // Build query string from filters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    const url = `${API_URL}/export${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(errorData.message || 'Export failed');
    }

    // Get metadata from headers
    const contentDisposition = response.headers.get('content-disposition');
    const filename = contentDisposition?.match(/filename="?(.+)"?/i)?.[1] || 'products-export.csv';
    const totalProducts = response.headers.get('x-total-products');

    const blob = await response.blob();

    // Return blob with metadata
    return {
      blob,
      filename,
      totalProducts: totalProducts ? parseInt(totalProducts, 10) : 0,
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to export products');
  }
};
