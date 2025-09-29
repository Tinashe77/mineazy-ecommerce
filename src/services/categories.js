const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://mining-equipment-backend.onrender.com' 
  : ''; // Empty string means use relative path (will be proxied)

const API_URL = `${API_BASE_URL}/api/categories`;
export const getCategories = async (token) => {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};