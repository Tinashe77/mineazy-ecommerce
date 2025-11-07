// src/services/categories.js
const API_BASE_URL = 'https://mining-equipment-backend.onrender.com';

const API_URL = `${API_BASE_URL}/api/categories`;

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// Public endpoint - Get all categories
export const getCategories = async (params = {}) => {
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

// Public endpoint - Get single category by ID
export const getCategoryById = async (id) => {
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

// Public endpoint - Get category by slug with products
export const getCategoryBySlug = async (slug, params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/slug/${slug}${queryString ? `?${queryString}` : ''}`, {
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

// Public endpoint - Get category tree structure
export const getCategoryTree = async () => {
  try {
    const response = await fetch(`${API_URL}/tree`, {
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

// Protected endpoint - Create new category (Inventory Manager/Super Admin)
export const createCategory = async (token, categoryData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: categoryData, // FormData
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Protected endpoint - Update category (Inventory Manager/Super Admin)
export const updateCategory = async (token, id, categoryData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: categoryData, // FormData
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Protected endpoint - Delete category (Inventory Manager/Super Admin)
// action: 'delete' | 'keep' | 'reassign'
// newCategoryId: Required when action is 'reassign'
export const deleteCategory = async (token, id, action = 'keep', newCategoryId = null) => {
  try {
    let url = `${API_URL}/${id}?action=${action}`;

    if (action === 'reassign' && newCategoryId) {
      url += `&newCategoryId=${newCategoryId}`;
    }

    const response = await fetch(url, {
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

// Get product count for a category
export const getCategoryProductCount = async (categoryId) => {
  try {
    const response = await fetch(`${API_URL}/${categoryId}/product-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message, count: 0 };
  }
};