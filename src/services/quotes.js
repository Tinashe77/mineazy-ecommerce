// src/services/quotes.js
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://mining-equipment-backend.onrender.com' 
  : '';

const API_URL = `${API_BASE_URL}/api/quotes`;

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// Public/User endpoints - Create quote request
export const createQuoteRequest = async (quoteData, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(quoteData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// User - Get user's quotes
export const getUserQuotes = async (token) => {
  try {
    const response = await fetch(API_URL, {
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

// Get single quote
export const getQuoteById = async (token, id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
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

// User - Accept quote
export const acceptQuote = async (token, id) => {
  try {
    const response = await fetch(`${API_URL}/${id}/accept`, {
      method: 'PUT',
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

// User - Reject quote
export const rejectQuote = async (token, id, reason) => {
  try {
    const response = await fetch(`${API_URL}/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Delete quote
export const deleteQuote = async (token, id) => {
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

// Admin endpoints - Get all quotes
export const getAdminQuotes = async (token, params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/admin/all${queryString ? `?${queryString}` : ''}`, {
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

// Admin - Update quote
export const updateQuote = async (token, id, updateData) => {
  try {
    const response = await fetch(`${API_URL}/${id}/admin/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Admin - Send quote to customer
export const sendQuoteToCustomer = async (token, id) => {
  try {
    const response = await fetch(`${API_URL}/${id}/send`, {
      method: 'POST',
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

// Admin - Get quote statistics
export const getQuoteStats = async (token) => {
  try {
    const response = await fetch(`${API_URL}/stats/overview`, {
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