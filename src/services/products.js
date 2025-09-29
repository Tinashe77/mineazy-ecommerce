// src/services/products.js
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

// Public endpoint - Get products with filtering and pagination
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

// Public endpoint - Get single product by ID
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

// Public endpoint - Get related products
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

// Public endpoint - Advanced product search
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

// Public endpoint - Get search suggestions
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

// Protected endpoint - Create new product (Inventory Manager/Super Admin)
export const createProduct = async (token, productData) => {
  try {
    // productData should be FormData with: name, description, price, sku, category, images (files), stockQuantity, specifications, tags
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: productData, // FormData
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Protected endpoint - Update product (Inventory Manager/Super Admin)
export const updateProduct = async (token, id, productData) => {
  try {
    // productData should be FormData
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData
      },
      body: productData, // FormData
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Protected endpoint - Delete product (Inventory Manager/Super Admin)
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

// Protected endpoint - Bulk import products from CSV
export const bulkImportProducts = async (token, csvFile) => {
  try {
    const formData = new FormData();
    formData.append('csv', csvFile);
    
    const response = await fetch(`${API_URL}/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Protected endpoint - Get CSV import template
export const getImportTemplate = async (token) => {
  try {
    const response = await fetch(`${API_URL}/import/template`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.blob(); // Returns file blob
  } catch (error) {
    console.error('Failed to download template:', error);
    return null;
  }
};

// Protected endpoint - Download sample CSV
export const getSampleCSV = async (token) => {
  try {
    const response = await fetch(`${API_URL}/import/sample`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.blob(); // Returns file blob
  } catch (error) {
    console.error('Failed to download sample:', error);
    return null;
  }
};