// src/services/products.js - COMPLETE FIX
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://mining-equipment-backend.onrender.com' 
  : '';

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

export const deleteProduct = async (token, id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
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