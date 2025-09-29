// src/services/invoices.js
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://mining-equipment-backend.onrender.com' 
  : '';

const API_URL = `${API_BASE_URL}/api/invoices`;

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// User endpoints - Get user's invoices
export const getUserInvoices = async (token) => {
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

// Get invoice by order ID
export const getInvoiceByOrderId = async (token, orderId, format = 'json') => {
  try {
    const response = await fetch(`${API_URL}/${orderId}?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (format === 'pdf') {
      return await response.blob();
    }
    
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get guest invoice
export const getGuestInvoice = async (orderNumber, email) => {
  try {
    const response = await fetch(`${API_URL}/guest/${orderNumber}/${email}`, {
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

// Send invoice via email
export const sendInvoice = async (token, orderId) => {
  try {
    const response = await fetch(`${API_URL}/${orderId}/send`, {
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

// Download invoice PDF
export const downloadInvoice = async (token, orderId) => {
  try {
    const response = await fetch(`${API_URL}/${orderId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.blob();
  } catch (error) {
    console.error('Failed to download invoice:', error);
    return null;
  }
};

// Admin endpoints - Get all invoices
export const getAdminInvoices = async (token, params = {}) => {
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

// Admin - Send invoice to customer
export const adminSendInvoice = async (token, orderId) => {
  try {
    const response = await fetch(`${API_URL}/admin/${orderId}/send`, {
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

// Admin - Generate PDF invoice
export const adminGeneratePDF = async (token, orderId) => {
  try {
    const response = await fetch(`${API_URL}/admin/${orderId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.blob();
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return null;
  }
};

// Admin - Bulk send invoices
export const bulkSendInvoices = async (token, orderIds) => {
  try {
    const response = await fetch(`${API_URL}/admin/bulk-send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderIds }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Admin - Get invoice statistics
export const getInvoiceStats = async (token) => {
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