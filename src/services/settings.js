// src/services/settings.js
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://mining-equipment-backend.onrender.com' 
  : '';

const API_URL = `${API_BASE_URL}/api/settings`;

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// Get all settings
export const getSettings = async (token) => {
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

// Update settings
export const updateSettings = async (token, settingsData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Test SMTP configuration
export const testSmtpSettings = async (token, smtpData) => {
  try {
    const response = await fetch(`${API_URL}/test-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smtpData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Test payment gateway
export const testPaymentGateway = async (token, paymentData) => {
  try {
    const response = await fetch(`${API_URL}/test-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};