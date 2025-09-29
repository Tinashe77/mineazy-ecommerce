import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getProducts, deleteProduct } from '../../services/products';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getProducts(token, page);
      if (response.products) {
        setProducts(response.products);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(token, id);
        fetchProducts(pagination.currentPage); // Refresh the list
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        <Link
          to="/dashboard/products/new"
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Add Product
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Category</th>
              <th className="py-3 px-6 text-center">Price</th>
              <th className="py-3 px-6 text-center">Stock</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {products.map((product) => (
              <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{product.name}</td>
                <td className="py-3 px-6 text-left">{product.category?.name || 'N/A'}</td>
                <td className="py-3 px-6 text-center">${product.price.toFixed(2)}</td>
                <td className="py-3 px-6 text-center">{product.stockQuantity}</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center">
                    <Link
                      to={`/dashboard/products/edit/${product._id}`}
                      className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110"
                    >
                      {/* Edit Icon */}
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="w-4 mr-2 transform hover:text-red-500 hover:scale-110"
                    >
                      {/* Delete Icon */}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Add pagination controls here */}
    </div>
  );
};

export default ProductsPage;