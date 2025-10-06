// src/components/dashboard/ProductForm.jsx - COMPLETE FIX
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { createProduct, getProductById, updateProduct } from '../../services/products';
import { getCategories } from '../../services/categories';

const ProductForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    salePrice: '',
    sku: '',
    category: '',
    stockQuantity: '0',
    weight: '',
    tags: '',
  });
  
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id, isEditMode]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories({ activeOnly: true });
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await getProductById(id);
      if (response._id) {
        setFormData({
          name: response.name || '',
          description: response.description || '',
          shortDescription: response.shortDescription || '',
          price: response.price || '',
          salePrice: response.salePrice || '',
          sku: response.sku || '',
          category: response.category?._id || '',
          stockQuantity: response.stockQuantity || '0',
          weight: response.weight || '',
          tags: response.tags?.join(', ') || '',
        });
        setExistingImages(response.images || []);
        
        if (response.specifications && Object.keys(response.specifications).length > 0) {
          const specsArray = Object.entries(response.specifications).map(([key, value]) => ({
            key,
            value: value.toString(),
          }));
          setSpecifications(specsArray);
        }
      }
    } catch (err) {
      setError('Failed to fetch product data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    setImages(files);
    setError(null);
  };

  const handleSpecificationChange = (index, field, value) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = value;
    setSpecifications(newSpecs);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.name || !formData.name.trim()) {
      setError('Product name is required');
      setLoading(false);
      return;
    }

    if (!formData.sku || !formData.sku.trim()) {
      setError('SKU is required');
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      setError('Valid price is required');
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      setLoading(false);
      return;
    }

    // Create FormData
    const productData = new FormData();
    
    // Append required fields
    productData.append('name', formData.name.trim());
    productData.append('sku', formData.sku.trim().toUpperCase());
    productData.append('price', parseFloat(formData.price).toString());
    productData.append('category', formData.category);
    productData.append('stockQuantity', parseInt(formData.stockQuantity) || 0);
    
    // CRITICAL: Backend validation requires description
    // If empty, send a default value or the short description
    const description = formData.description?.trim() || formData.shortDescription?.trim() || formData.name.trim();
    productData.append('description', description);
    
    // Append optional fields
    if (formData.shortDescription && formData.shortDescription.trim()) {
      productData.append('shortDescription', formData.shortDescription.trim());
    }
    
    if (formData.salePrice && formData.salePrice !== '' && parseFloat(formData.salePrice) > 0) {
      productData.append('salePrice', parseFloat(formData.salePrice).toString());
    }
    
    if (formData.weight && formData.weight !== '' && parseFloat(formData.weight) > 0) {
      productData.append('weight', parseFloat(formData.weight).toString());
    }
    
    if (formData.tags && formData.tags.trim()) {
      productData.append('tags', formData.tags.trim());
    }
    
    // Convert specifications array to object
    const specsObject = {};
    specifications.forEach(spec => {
      if (spec.key && spec.key.trim() && spec.value && spec.value.trim()) {
        specsObject[spec.key.trim()] = spec.value.trim();
      }
    });
    
    if (Object.keys(specsObject).length > 0) {
      productData.append('specifications', JSON.stringify(specsObject));
    }
    
    // Append images - field name is 'images' (matches backend upload.array('images', 5))
    if (images && images.length > 0) {
      images.forEach((image) => {
        productData.append('images', image);
      });
    }
    
    // Debug logging
    console.log('=== Product Form Submission ===');
    console.log('Is Edit Mode:', isEditMode);
    console.log('FormData contents:');
    for (let pair of productData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
      } else {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
    }

    try {
      let response;
      if (isEditMode) {
        console.log('Updating product ID:', id);
        response = await updateProduct(token, id, productData);
      } else {
        console.log('Creating new product');
        response = await createProduct(token, productData);
      }
      
      console.log('Server response:', response);
      
      if (response.success !== false && (response.product || response.message)) {
        alert(response.message || 'Product saved successfully!');
        navigate('/dashboard/products');
      } else {
        setError(response.message || 'Failed to save product');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to save product. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.name) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:text-white">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        {isEditMode ? 'Edit Product' : 'Create Product'}
      </h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Short Description
            </label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              maxLength={200}
              placeholder="Brief product description"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Detailed product description"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Required field - provide a detailed description of the product
            </p>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Sale Price
            </label>
            <input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="mining, equipment, heavy-duty"
              className="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Product Images (Max 5)
            </label>
            {existingImages.length > 0 && (
              <div className="mb-3 flex gap-2 flex-wrap">
                <p className="w-full text-sm text-gray-600 dark:text-gray-400">Current images:</p>
                {existingImages.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt={`Product ${idx + 1}`} 
                    className="w-20 h-20 object-cover rounded border dark:border-gray-600" 
                  />
                ))}
              </div>
            )}
            <input
              type="file"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full dark:text-gray-300"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Max 5 images, 5MB each. Formats: JPG, PNG, GIF, WebP
            </p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Specifications
            </label>
            {specifications.map((spec, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Key (e.g., Brand)"
                  value={spec.key}
                  onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Caterpillar)"
                  value={spec.value}
                  onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
                {specifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSpecification}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Add Specification
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/products')}
            className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;