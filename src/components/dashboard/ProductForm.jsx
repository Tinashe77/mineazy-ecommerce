import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { createProduct, getProductById, updateProduct } from '../../services/products';
import { getCategories } from '../../services/categories'; // Assuming this service exists

const ProductForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sku: '',
    category: '',
    stockQuantity: '',
  });
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch categories for the dropdown
    const fetchCategories = async () => {
      try {
        const response = await getCategories(token);
        if (response.categories) {
          setCategories(response.categories);
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };

    fetchCategories();

    if (isEditMode) {
      // Fetch product data for editing
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const response = await getProductById(token, id);
          if (response) {
            setFormData({
              name: response.name,
              description: response.description,
              price: response.price,
              sku: response.sku,
              category: response.category._id,
              stockQuantity: response.stockQuantity,
            });
          }
        } catch (err) {
          setError('Failed to fetch product data.');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const productData = new FormData();
    Object.keys(formData).forEach((key) => {
      productData.append(key, formData[key]);
    });
    images.forEach((image) => {
      productData.append('images', image);
    });

    try {
      if (isEditMode) {
        await updateProduct(token, id, productData);
      } else {
        await createProduct(token, productData);
      }
      navigate('/dashboard/products');
    } catch (err) {
      setError('Failed to save product. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <div>Loading product...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEditMode ? 'Edit Product' : 'Create Product'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form fields will go here */}
          <div>
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full mt-2 p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full mt-2 p-2 border rounded"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full mt-2 p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full mt-2 p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Stock Quantity</label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              className="w-full mt-2 p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full mt-2 p-2 border rounded"
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
          <div className="md:col-span-2">
            <label className="block text-gray-700">Images</label>
            <input
              type="file"
              name="images"
              multiple
              onChange={handleImageChange}
              className="w-full mt-2"
            />
          </div>
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        <div className="mt-6">
          <button
            type="submit"
            className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;