// src/context/ProductContext.jsx
import { createContext, useState, useEffect } from 'react';
import { getProducts, getProductById, getRelatedProducts, searchProducts } from '../services/products';
import { getCategories } from '../services/categories';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    featured: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const response = await getCategories({ activeOnly: true });
    if (response.categories) {
      setCategories(response.categories);
    }
  };

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    const params = {
      page,
      limit: 12,
      ...filters,
    };

    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await getProducts(params);
    
    if (response.products) {
      setProducts(response.products);
      setPagination(response.pagination);
    } else {
      setError(response.message || 'Failed to fetch products');
    }
    
    setLoading(false);
  };

  const fetchProductById = async (id) => {
    setLoading(true);
    setError(null);
    
    const response = await getProductById(id);
    
    setLoading(false);
    
    if (response._id) {
      return response;
    } else {
      setError(response.message || 'Failed to fetch product');
      return null;
    }
  };

  const fetchRelatedProducts = async (id) => {
    const response = await getRelatedProducts(id);
    if (response.products) {
      return response.products;
    }
    return [];
  };

  const searchProductsWithFilters = async (query, page = 1) => {
    setLoading(true);
    setError(null);
    
    const params = {
      page,
      limit: 12,
      ...filters,
    };

    const response = await searchProducts(query, params);
    
    if (response.products) {
      setProducts(response.products);
      setPagination(response.pagination);
    } else {
      setError(response.message || 'Search failed');
    }
    
    setLoading(false);
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      inStock: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      featured: '',
    });
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        loading,
        error,
        pagination,
        filters,
        fetchProducts,
        fetchProductById,
        fetchRelatedProducts,
        searchProductsWithFilters,
        updateFilters,
        resetFilters,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};