// src/components/Products/ProductFilters.jsx
import { useContext, useState } from 'react';
import { ProductContext } from '../../context/ProductContext';

const ProductFilters = () => {
  const { categories, filters, updateFilters, resetFilters, fetchProducts } = useContext(ProductContext);
  
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    updateFilters(localFilters);
    fetchProducts(1);
  };

  const handleReset = () => {
    setLocalFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      inStock: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      featured: '',
    });
    resetFilters();
    fetchProducts(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">Filters</h3>
        <button
          onClick={handleReset}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Category
          </label>
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min"
              value={localFilters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max"
              value={localFilters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stock Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Availability
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="stock"
                value=""
                checked={localFilters.inStock === ''}
                onChange={(e) => handleFilterChange('inStock', e.target.value)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-primary-700">All Products</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="stock"
                value="true"
                checked={localFilters.inStock === 'true'}
                onChange={(e) => handleFilterChange('inStock', e.target.value)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-primary-700">In Stock</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="stock"
                value="false"
                checked={localFilters.inStock === 'false'}
                onChange={(e) => handleFilterChange('inStock', e.target.value)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-primary-700">Out of Stock</span>
            </label>
          </div>
        </div>

        {/* Featured Products */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={localFilters.featured === 'true'}
              onChange={(e) => handleFilterChange('featured', e.target.checked ? 'true' : '')}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">
              Featured Products Only
            </span>
          </label>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Sort By
          </label>
          <select
            value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={applyFilters}
          className="w-full bg-primary-700 text-white py-3 rounded-xl font-medium hover:bg-primary-800 transition-colors shadow-lg shadow-primary-700/20"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default ProductFilters;