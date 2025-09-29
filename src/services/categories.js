const API_URL = `${import.meta.env.VITE_API_URL}/api/categories`;

export const getCategories = async (token) => {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};