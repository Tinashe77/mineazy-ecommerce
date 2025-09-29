import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getBlogCategories, createBlogCategory, updateBlogCategory, deleteBlogCategory } from '../../services/blog';

const BlogCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getBlogCategories();
      
      if (response.categories) {
        setCategories(response.categories);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (err) {
      setError('Failed to fetch categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      let response;
      if (editingId) {
        response = await updateBlogCategory(token, editingId, formData);
      } else {
        response = await createBlogCategory(token, formData);
      }
      
      if (response.success !== false) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', slug: '', description: '' });
        fetchCategories();
      } else {
        setError(response.message || 'Failed to save category');
      }
    } catch (err) {
      setError('Failed to save category: ' + err.message);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete category "${name}"? This will affect posts in this category.`)) {
      try {
        const response = await deleteBlogCategory(token, id);
        
        if (response.success !== false) {
          fetchCategories();
        } else {
          alert('Failed to delete category: ' + response.message);
        }
      } catch (err) {
        alert('Failed to delete category: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '' });
    setError(null);
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/dashboard/blog')}
            className="text-indigo-600 hover:text-indigo-800 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Blog Categories</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Category' : 'Create Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                placeholder="category-slug"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                URL-friendly version (lowercase, hyphens only)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Slug</th>
              <th className="py-3 px-6 text-left">Description</th>
              <th className="py-3 px-6 text-center">Posts</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-6 font-medium">{category.name}</td>
                <td className="py-3 px-6 text-sm text-gray-600">{category.slug}</td>
                <td className="py-3 px-6 text-sm text-gray-600">
                  {category.description || 'No description'}
                </td>
                <td className="py-3 px-6 text-center">
                  {category.postCount || 0}
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category._id, category.name)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No categories yet. Create your first category.
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCategoriesPage;