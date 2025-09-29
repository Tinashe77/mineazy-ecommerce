// src/components/Products/ProductCard.jsx
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <Link
      to={`/products/${product._id}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <img
          src={product.images?.[0] || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              -{discountPercentage}%
            </span>
          )}
          {product.featured && (
            <span className="bg-accent-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
              Featured
            </span>
          )}
          {!product.inStock && (
            <span className="bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <button className="bg-white text-primary-700 px-6 py-2 rounded-lg font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            Quick View
          </button>
        </div>
      </div>

      <div className="p-4">
        {product.category && (
          <p className="text-xs font-medium text-primary-600 mb-2 uppercase tracking-wider">
            {product.category.name}
          </p>
        )}

        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {product.name}
        </h3>

        {product.shortDescription && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(hasDiscount ? product.salePrice : product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          {product.inStock && (
            <span className="text-xs text-green-600 font-medium">
              {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'In Stock'}
            </span>
          )}
        </div>

        {product.sku && (
          <p className="text-xs text-gray-400 mt-2">
            SKU: {product.sku}
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;