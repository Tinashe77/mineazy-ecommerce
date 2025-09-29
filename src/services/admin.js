const API_URL = `${import.meta.env.VITE_API_URL}/api/admin`;

export const getDashboardStats = async (token) => {
  const response = await fetch(`${API_URL}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};