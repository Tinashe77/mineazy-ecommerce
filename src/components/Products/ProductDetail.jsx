// src/components/Products/ProductDetail.jsx
import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductContext } from '../../context/ProductContext';
import ProductCard from './ProductCard';

const ProductDetail = () => {
  const { id } = useParams();
  const { fetchProductById, fetchRelatedProducts } = useContext(ProductContext);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    
    const productData = await fetchProductById(id);
    if (productData) {
      setProduct(productData);
      setSelectedImage(0);
      
      const related = await fetchRelatedProducts(id);
      setRelatedProducts(related);
    } else {
      setError('Product not found');
    }
    
    setLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 999)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <svg className="animate-spin h-12 w-12 text-primary-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Product Not Found</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Link to="/products" className="px-6 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors inline-block">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-primary-700">Home</Link>
            <span className="text-gray-300">/</span>
            <Link to="/products" className="text-gray-500 hover:text-primary-700">Products</Link>
            <span className="text-gray-300">/</span>
            {product.category && (
              <>
                <span className="text-gray-500">{product.category.name}</span>
                <span className="text-gray-300">/</span>
              </>
            )}
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden aspect-square">
              <img
                src={product.images?.[selectedImage] || '/placeholder-product.png'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                  -{discountPercentage}% OFF
                </span>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-primary-700 shadow-lg'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {product.category && (
              <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-full">
                {product.category.name}
              </span>
            )}

            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{product.name}</h1>

            {product.shortDescription && (
              <p className="text-lg text-gray-600">{product.shortDescription}</p>
            )}

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">
                {formatPrice(hasDiscount ? product.salePrice : product.price)}
              </span>
              {hasDiscount && (
                <span className="text-2xl text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">
                    In Stock {product.stockQuantity && `(${product.stockQuantity} available)`}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {product.sku && (
              <p className="text-sm text-gray-500">SKU: <span className="font-mono">{product.sku}</span></p>
            )}

            {product.inStock && (
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Quantity:</span>
                <div className="flex items-center border-2 border-gray-200 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-x-2 border-gray-200 py-2 focus:outline-none"
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                disabled={!product.inStock}
                className="flex-1 bg-primary-700 text-white py-4 rounded-xl font-semibold hover:bg-primary-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-primary-700/20"
              >
                Add to Cart
              </button>
              <button className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary-700 hover:text-primary-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Free shipping on orders over $500</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Secure payment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b border-gray-100">
                    <span className="font-medium text-gray-700 capitalize">{key}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;