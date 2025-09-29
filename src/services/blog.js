// src/services/blog.js
const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://mining-equipment-backend.onrender.com' 
  : '';

const API_URL = `${API_BASE_URL}/api/blog`;

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

// Public endpoints - Get blog posts
export const getBlogPosts = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/posts${queryString ? `?${queryString}` : ''}`, {
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

// Get single blog post by slug
export const getBlogPostBySlug = async (slug) => {
  try {
    const response = await fetch(`${API_URL}/posts/${slug}`, {
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

// Get related blog posts
export const getRelatedPosts = async (slug) => {
  try {
    const response = await fetch(`${API_URL}/posts/related/${slug}`, {
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

// Admin endpoints - Create blog post
export const createBlogPost = async (token, postData) => {
  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: postData, // FormData
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Update blog post
export const updateBlogPost = async (token, id, postData) => {
  try {
    const response = await fetch(`${API_URL}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: postData, // FormData
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Delete blog post
export const deleteBlogPost = async (token, id) => {
  try {
    const response = await fetch(`${API_URL}/posts/${id}`, {
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

// Blog Categories
export const getBlogCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/categories`, {
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

export const createBlogCategory = async (token, categoryData) => {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateBlogCategory = async (token, id, categoryData) => {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteBlogCategory = async (token, id) => {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
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

// Get popular tags
export const getBlogTags = async () => {
  try {
    const response = await fetch(`${API_URL}/tags`, {
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

// Get featured posts
export const getFeaturedPosts = async () => {
  try {
    const response = await fetch(`${API_URL}/featured`, {
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

// Get blog archive
export const getBlogArchive = async () => {
  try {
    const response = await fetch(`${API_URL}/archive`, {
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