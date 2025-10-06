import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getCategories, deleteCategory, getCategoryTree } from '../../services/categories';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [treeView, setTreeView] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'tree'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    activeOnly: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      
      if (filters.search) {
        params.search = filters.search;
      }
      
      if (filters.activeOnly) {
        params.activeOnly = filters.activeOnly === 'true';
      }

      const response = await getCategories(params);
      
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

  const fetchTreeView = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getCategoryTree();
      
      if (response.tree || response.categories) {
        setTreeView(response.tree || response.categories || []);
      } else {
        setError('Failed to fetch category tree');
      }
    } catch (err) {
      setError('Failed to fetch category tree: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'tree') {
      fetchTreeView();
    } else {
      fetchCategories();
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also affect products in this category.`)) {
      try {
        const response = await deleteCategory(token, id);
        
        if (response.success !== false) {
          if (viewMode === 'tree') {
            fetchTreeView();
          } else {
            fetchCategories();
          }
        } else {
          alert('Failed to delete category: ' + response.message);
        }
      } catch (error) {
        alert('Failed to delete category: ' + error.message);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCategories();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      activeOnly: '',
    });
    setTimeout(() => fetchCategories(), 0);
  };

  const renderTreeNode = (category, level = 0) => {
    return (
      <div key={category._id}>
        <div 
          className="flex items-center justify-between py-3 px-6 border-b border-gray-200 hover:bg-gray-50"
          style={{ paddingLeft: `${level * 2 + 1.5}rem` }}
        >
          <div className="flex items-center gap-3">
            {level > 0 && (
              <span className="text-gray-400">└─</span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{category.name}</span>
                {!category.isActive && (
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/categories/edit/${category._id}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDelete(category._id, category.name)}
              className="text-red-600 hover:text-red-800 font-medium text-sm"
            >
              Delete
            </button>
          </div>
        </div>
        {category.children && category.children.length > 0 && (
          <div>
            {category.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading && (viewMode === 'list' ? categories.length === 0 : treeView.length === 0)) {
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
        <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
        <Link
          to="/dashboard/categories/new"
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Add Category
        </Link>
      </div>

      

      {/* Filters - Only show in list view */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Category name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="activeOnly"
                  value={filters.activeOnly}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => viewMode === 'tree' ? fetchTreeView() : fetchCategories()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Categories Display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Image</th>
                  <th className="py-3 px-6 text-left">Name</th>
                  <th className="py-3 px-6 text-left">Description</th>
                  <th className="py-3 px-6 text-left">Parent</th>
                  <th className="py-3 px-6 text-center">Sort Order</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {categories.map((category) => (
                  <tr key={category._id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-6 text-left font-medium">{category.name}</td>
                    <td className="py-3 px-6 text-left">
                      {category.description ? (
                        <span className="line-clamp-2">{category.description}</span>
                      ) : (
                        <span className="text-gray-400">No description</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {category.parent?.name || <span className="text-gray-400">None</span>}
                    </td>
                    <td className="py-3 px-6 text-center">{category.sortOrder || 0}</td>
                    <td className="py-3 px-6 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center gap-2">
                        <Link
                          to={`/dashboard/categories/edit/${category._id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </Link>
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

            {categories.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                No categories found.
              </div>
            )}
          </div>
        ) : (
          <div>
            {treeView.length > 0 ? (
              treeView.map(category => renderTreeNode(category))
            ) : (
              <div className="text-center py-12 text-gray-500">
                No categories found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Info */}
      {viewMode === 'list' && categories.length > 0 && (
        <div className="mt-4 text-gray-600">
          Total: {categories.length} categories
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;