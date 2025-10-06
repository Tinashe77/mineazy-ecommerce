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
    stockQuantity: '',
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
          stockQuantity: response.stockQuantity || '',
          weight: response.weight || '',
          tags: response.tags?.join(', ') || '',
        });
        setExistingImages(response.images || []);
        
        // Convert specifications object to array
        if (response.specifications) {
          const specsArray = Object.entries(response.specifications).map(([key, value]) => ({
            key,
            value: value.toString(),
          }));
          setSpecifications(specsArray.length > 0 ? specsArray : [{ key: '', value: '' }]);
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
    setImages([...e.target.files]);
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

    const productData = new FormData();
    
    // Append form fields
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        productData.append(key, formData[key]);
      }
    });
    
    // Append images
    images.forEach((image) => {
      productData.append('images', image);
    });
    
    // Convert specifications array to object
    const specsObject = {};
    specifications.forEach(spec => {
      if (spec.key && spec.value) {
        specsObject[spec.key] = spec.value;
      }
    });
    
    if (Object.keys(specsObject).length > 0) {
      productData.append('specifications', JSON.stringify(specsObject));
    }

    try {
      let response;
      if (isEditMode) {
        response = await updateProduct(token, id, productData);
      } else {
        response = await createProduct(token, productData);
      }
      
      if (response.success !== false) {
        navigate('/dashboard/products');
      } else {
        setError(response.message || 'Failed to save product');
      }
    } catch (err) {
      setError('Failed to save product. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.name) {
    return <div className="text-center py-12">Loading product...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEditMode ? 'Edit Product' : 'Create Product'}
      </h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">SKU *</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Short Description</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              maxLength={200}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Price *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Sale Price</label>
            <input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Stock Quantity *</label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
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
            <label className="block text-gray-700 font-medium mb-2">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="mining, equipment, heavy-duty"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Product Images</label>
            {existingImages.length > 0 && (
              <div className="mb-3 flex gap-2 flex-wrap">
                {existingImages.map((img, idx) => (
                  <img key={idx} src={img} alt="" className="w-20 h-20 object-cover rounded border" />
                ))}
              </div>
            )}
            <input
              type="file"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">Max 10 images, 5MB each</p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Specifications</label>
            {specifications.map((spec, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Key (e.g., Brand)"
                  value={spec.key}
                  onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Caterpillar)"
                  value={spec.value}
                  onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeSpecification(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSpecification}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Add Specification
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/products')}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;