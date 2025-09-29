import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { createCategory, getCategoryById, updateCategory, getCategories } from '../../services/categories';

const CategoryForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: '',
    sortOrder: 0,
    isActive: true,
  });
  
  const [image, setImage] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchCategory();
    }
  }, [id, isEditMode]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories({ activeOnly: false });
      if (response.categories) {
        // Filter out the current category when editing (can't be its own parent)
        const filtered = isEditMode 
          ? response.categories.filter(cat => cat._id !== id)
          : response.categories;
        setCategories(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const response = await getCategoryById(id);
      if (response._id) {
        setFormData({
          name: response.name || '',
          description: response.description || '',
          parent: response.parent?._id || '',
          sortOrder: response.sortOrder || 0,
          isActive: response.isActive !== undefined ? response.isActive : true,
        });
        setExistingImage(response.image || '');
      }
    } catch (err) {
      setError('Failed to fetch category data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const categoryData = new FormData();
    
    // Append form fields
    categoryData.append('name', formData.name);
    if (formData.description) {
      categoryData.append('description', formData.description);
    }
    if (formData.parent) {
      categoryData.append('parent', formData.parent);
    }
    categoryData.append('sortOrder', formData.sortOrder);
    categoryData.append('isActive', formData.isActive);
    
    // Append image if selected
    if (image) {
      categoryData.append('image', image);
    }

    try {
      let response;
      if (isEditMode) {
        response = await updateCategory(token, id, categoryData);
      } else {
        response = await createCategory(token, categoryData);
      }
      
      if (response.success !== false) {
        navigate('/dashboard/categories');
      } else {
        setError(response.message || 'Failed to save category');
      }
    } catch (err) {
      setError('Failed to save category. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.name) {
    return <div className="text-center py-12">Loading category...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEditMode ? 'Edit Category' : 'Create Category'}
      </h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Mining Equipment"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Brief description of this category"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Parent Category
            </label>
            <select
              name="parent"
              value={formData.parent}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">None (Top Level)</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Select a parent category to create a subcategory
            </p>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Sort Order
            </label>
            <input
              type="number"
              name="sortOrder"
              value={formData.sortOrder}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Lower numbers appear first
            </p>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Category Image
            </label>
            {existingImage && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Current image:</p>
                <img 
                  src={existingImage} 
                  alt="Current category" 
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Max 5MB. Recommended size: 400x400px
            </p>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label className="ml-2 text-gray-700 font-medium">
              Active
            </label>
            <p className="ml-3 text-sm text-gray-500">
              Inactive categories won't be visible to customers
            </p>
          </div>
        </div>
        
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Category' : 'Create Category'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/categories')}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;