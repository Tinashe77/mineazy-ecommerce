// src/services/email.js
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://mining-equipment-backend.onrender.com' 
  : '';

const API_URL = `${API_BASE_URL}/api/emails`;

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// Send order confirmation email
export const sendOrderConfirmation = async (token, orderId) => {
  try {
    const response = await fetch(`${API_URL}/order-confirmation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send invoice email
export const sendInvoiceEmail = async (token, orderId) => {
  try {
    const response = await fetch(`${API_URL}/invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send order status update email
export const sendOrderStatusEmail = async (token, orderId, status) => {
  try {
    const response = await fetch(`${API_URL}/order-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, status }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send custom email
export const sendCustomEmail = async (token, emailData) => {
  try {
    const response = await fetch(`${API_URL}/custom`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send newsletter
export const sendNewsletter = async (token, newsletterData) => {
  try {
    const response = await fetch(`${API_URL}/newsletter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newsletterData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Bulk send order update emails
export const bulkSendOrderUpdate = async (token, orderIds, message) => {
  try {
    const response = await fetch(`${API_URL}/bulk-order-update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderIds, message }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Send test email
export const sendTestEmail = async (token, recipient) => {
  try {
    const response = await fetch(`${API_URL}/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get email templates
export const getEmailTemplates = async (token) => {
  try {
    const response = await fetch(`${API_URL}/templates`, {
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

// Get email statistics
export const getEmailStats = async (token) => {
  try {
    const response = await fetch(`${API_URL}/stats`, {
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