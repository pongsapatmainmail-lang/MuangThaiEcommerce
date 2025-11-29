'use client';

/**
 * ===========================================
 * Product Card Component
 * ===========================================
 */
import Link from 'next/link';
import Image from 'next/image';
import { FiStar, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-100">
          {product.main_image ? (
            <Image
              src={product.main_image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              ไม่มีรูปภาพ
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold">สินค้าหมด</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center mb-2">
            <FiStar className="text-yellow-400 fill-current mr-1" />
            <span className="text-sm text-gray-600">
              {product.average_rating || 0} ({product.review_count || 0})
            </span>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <p className="text-lg font-bold text-primary-500">
              {formatPrice(product.price)}
            </p>
            {product.seller_name && (
              <p className="text-xs text-gray-500 mt-1">{product.seller_name}</p>
            )}
          </div>

          {/* Add to Cart Button */}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="mt-3 w-full py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors flex items-center justify-center"
            >
              <FiShoppingCart className="mr-2" />
              เพิ่มลงตะกร้า
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}