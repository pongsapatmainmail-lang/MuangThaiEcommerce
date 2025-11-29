'use client';

/**
 * ===========================================
 * Cart Page
 * ===========================================
 */
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold mb-4">ตะกร้าว่างเปล่า</h1>
        <p className="text-gray-500 mb-6">ยังไม่มีสินค้าในตะกร้า</p>
        <Link
          href="/products"
          className="inline-block px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          เลือกซื้อสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ตะกร้าสินค้า</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-lg p-4 flex gap-4"
            >
              {/* Image */}
              <div className="relative w-24 h-24 bg-gray-100 rounded flex-shrink-0">
                {item.product.main_image ? (
                  <Image
                    src={item.product.main_image}
                    alt={item.product.name}
                    fill
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    ไม่มีรูป
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <Link
                  href={`/products/${item.product.id}`}
                  className="font-medium hover:text-primary-500 line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <p className="text-primary-500 font-bold mt-1">
                  {formatPrice(item.product.price)}
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity - 1)
                  }
                  className="p-1 border rounded hover:bg-gray-100"
                >
                  <FiMinus size={16} />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity + 1)
                  }
                  className="p-1 border rounded hover:bg-gray-100"
                >
                  <FiPlus size={16} />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[100px]">
                <p className="font-bold">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-red-500 hover:underline text-sm mt-1 flex items-center justify-end"
                >
                  <FiTrash2 size={14} className="mr-1" />
                  ลบ
                </button>
              </div>
            </div>
          ))}

          {/* Clear Cart */}
          <button
            onClick={clearCart}
            className="text-red-500 hover:underline"
          >
            ล้างตะกร้าทั้งหมด
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-4">สรุปคำสั่งซื้อ</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">ยอดรวมสินค้า</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ค่าจัดส่ง</span>
                <span>฿40.00</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>ยอดรวมทั้งหมด</span>
                <span className="text-primary-500">
                  {formatPrice(totalPrice + 40)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
            >
              ดำเนินการสั่งซื้อ
            </button>

            <Link
              href="/products"
              className="block text-center text-primary-500 hover:underline mt-4"
            >
              เลือกซื้อสินค้าเพิ่ม
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}