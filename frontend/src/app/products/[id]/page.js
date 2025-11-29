'use client';

/**
 * ===========================================
 * Product Detail Page (with Chat Button)
 * ===========================================
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FiStar, FiMinus, FiPlus, FiShoppingCart, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { productsAPI, reviewsAPI } from '@/lib/api';
import ChatButton from '@/components/chat/ChatButton';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          productsAPI.getById(params.id),
          reviewsAPI.getByProduct(params.id),
        ]);
        setProduct(productRes.data);
        setReviews(reviewsRes.data.results || reviewsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('ไม่พบสินค้า');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  // Helper function เพื่อดึง URL รูปภาพ (รองรับทั้ง image และ image_url)
  const getImageUrl = (img) => {
    if (!img) return null;
    return img.image_url || img.image || null;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-200 h-96 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-xl text-gray-500">ไม่พบสินค้า</p>
      </div>
    );
  }

  const images = product.images || [];
  const mainImageUrl = getImageUrl(images[selectedImage]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="bg-white rounded-lg overflow-hidden mb-4">
            <div className="relative h-96 flex items-center justify-center">
              {mainImageUrl ? (
                <img
                  src={mainImageUrl}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  ไม่มีรูปภาพ
                </div>
              )}
            </div>
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, index) => {
                const thumbUrl = getImageUrl(img);
                return thumbUrl ? (
                  <button
                    key={img.id || index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded border-2 overflow-hidden flex-shrink-0 ${
                      selectedImage === index
                        ? 'border-primary-500'
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400 mr-2">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={
                    i < Math.round(product.average_rating || 0)
                      ? 'fill-current'
                      : ''
                  }
                />
              ))}
            </div>
            <span className="text-gray-600">
              {product.average_rating || 0} ({product.review_count || 0} รีวิว)
            </span>
          </div>

          {/* Price */}
          <p className="text-3xl font-bold text-primary-500 mb-4">
            {formatPrice(product.price)}
          </p>

          {/* Stock */}
          <p className="text-gray-600 mb-4">
            สต็อก: {product.stock > 0 ? `${product.stock} ชิ้น` : 'สินค้าหมด'}
          </p>

          {/* Seller */}
          {product.seller && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">ร้านค้า</p>
              <p className="font-medium">{product.seller.shop_name || product.seller.username}</p>
            </div>
          )}

          {/* Quantity */}
          {product.stock > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">จำนวน</p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border rounded hover:bg-gray-100"
                >
                  <FiMinus />
                </button>
                <span className="text-xl font-medium w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="p-2 border rounded hover:bg-gray-100"
                >
                  <FiPlus />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FiShoppingCart className="mr-2" />
              {product.stock > 0 ? 'เพิ่มลงตะกร้า' : 'สินค้าหมด'}
            </button>

            {/* Chat Button - แสดงเฉพาะถ้าไม่ใช่สินค้าของตัวเอง */}
            {product.seller && user?.id !== product.seller.id && (
              <ChatButton
                sellerId={product.seller.id}
                productId={product.id}
                sellerName={product.seller.shop_name || product.seller.username}
                className="w-full"
              />
            )}
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-2">รายละเอียดสินค้า</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">
          รีวิวสินค้า ({reviews.length})
        </h2>
        
        {reviews.length === 0 ? (
          <p className="text-gray-500">ยังไม่มีรีวิว</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4">
                <div className="flex items-center mb-2">
                  <span className="font-medium mr-2">{review.user_name}</span>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        size={14}
                        className={i < review.rating ? 'fill-current' : ''}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(review.created_at).toLocaleDateString('th-TH')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}