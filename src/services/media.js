// src/services/media.js
const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://mining-equipment-backend.onrender.com'
  : 'http://localhost:3000';

const API_URL = `${API_BASE_URL}/api/media`;

const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
};

/**
 * Get all media with filtering and pagination
 * @param {string} token - Authentication token
 * @param {Object} params - Query parameters (page, limit, folder, tags, search, sortBy, sortOrder)
 * @returns {Promise<Object>} Media list with pagination info
 */
export const getMedia = async (token, params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}${queryString ? `?${queryString}` : ''}`, {
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

/**
 * Upload single or multiple images
 * @param {string} token - Authentication token
 * @param {Array<File>|File} files - Image file(s) to upload
 * @param {Object} options - Upload options (folder, tags, alt, title)
 * @returns {Promise<Object>} Upload results
 */
export const uploadMedia = async (token, files, options = {}) => {
  try {
    const formData = new FormData();

    // Handle single file or array of files
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => {
      formData.append('images', file);
    });

    // Add options
    if (options.folder) formData.append('folder', options.folder);
    if (options.tags) formData.append('tags', options.tags);
    if (options.alt) formData.append('alt', options.alt);
    if (options.title) formData.append('title', options.title);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO Content-Type header for FormData - browser sets it with boundary
      },
      body: formData,
    });

    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Get single media item
 * @param {string} token - Authentication token
 * @param {string} id - Media ID
 * @returns {Promise<Object>} Media item
 */
export const getMediaById = async (token, id) => {
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

/**
 * Update media metadata
 * @param {string} token - Authentication token
 * @param {string} id - Media ID
 * @param {Object} data - Update data (alt, title, tags, folder)
 * @returns {Promise<Object>} Updated media item
 */
export const updateMedia = async (token, id, data) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Delete single media item
 * @param {string} token - Authentication token
 * @param {string} id - Media ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteMedia = async (token, id) => {
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

/**
 * Delete multiple media items
 * @param {string} token - Authentication token
 * @param {Array<string>} mediaIds - Array of media IDs to delete
 * @returns {Promise<Object>} Bulk deletion results
 */
export const bulkDeleteMedia = async (token, mediaIds) => {
  try {
    const response = await fetch(`${API_URL}/bulk-delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mediaIds }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Get media statistics
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Media statistics
 */
export const getMediaStats = async (token) => {
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
