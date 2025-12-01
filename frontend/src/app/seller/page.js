'use client';

/**
 * ===========================================
 * Seller Dashboard
 * ===========================================
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { productsAPI, ordersAPI } from '@/lib/api';
import { FiPackage, FiShoppingBag, FiDollarSign, FiPlus } from 'react-icons/fi';

export default function SellerDashboard() {
  const router = useRouter();
  const { isAuthenticated, isSeller, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/seller');
      return;
    }

    if (!isSeller) {
      router.push('/profile');
      return;
    }

    fetchData();
  }, [isAuthenticated, isSeller, router]);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        productsAPI.getMyProducts(),
        ordersAPI.getAll({ role: 'seller' }),
      ]);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data.results || ordersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'รอดำเนินการ',
      confirmed: 'ยืนยันแล้ว',
      paid: 'ชำระเงินแล้ว',
      shipped: 'จัดส่งแล้ว',
      delivered: 'ส่งถึงแล้ว',
      cancelled: 'ยกเลิก',
    };
    return labels[status] || status;
  };

  if (!isAuthenticated || !isSeller) {
    return null;
  }

  const totalRevenue = orders
    .filter((o) => o.payment_status)
    .reduce((sum, o) => sum + parseFloat(o.total || o.total_amount || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === 'paid' || o.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ร้านค้าของฉัน</h1>
          <p className="text-gray-500">{user?.shop_name}</p>
        </div>
        <Link
          href="/seller/products/new"
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          <FiPlus className="mr-2" />
          เพิ่มสินค้าใหม่
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/seller/products" className="bg-white rounded-lg p-6 hover:shadow-lg transition">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiPackage className="text-2xl text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">สินค้าทั้งหมด</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </Link>

        <Link href="/seller/orders" className="bg-white rounded-lg p-6 hover:shadow-lg transition">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiShoppingBag className="text-2xl text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">รอจัดส่ง</p>
              <p className="text-2xl font-bold">{pendingOrders}</p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiDollarSign className="text-2xl text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">รายได้รวม</p>
              <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">คำสั่งซื้อล่าสุด</h2>
          <Link href="/seller/orders" className="text-primary-500 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-center py-4">ยังไม่มีคำสั่งซื้อ</p>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex justify-between items-center border-b pb-4"
              >
                <div>
                  <p className="font-medium">#{order.order_number}</p>
                  <p className="text-sm text-gray-500">
                    {order.shipping_name || order.buyer_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(order.total || order.total_amount)}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'paid'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'shipped'
                        ? 'bg-purple-100 text-purple-800'
                        : order.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">สินค้าของฉัน</h2>
          <Link href="/seller/products" className="text-primary-500 hover:underline">
            จัดการสินค้า
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">ยังไม่มีสินค้า</p>
            <Link
              href="/seller/products/new"
              className="inline-block px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              เพิ่มสินค้าแรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 8).map((product) => (
              <Link 
                key={product.id} 
                href={`/seller/products/${product.id}/edit`}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-primary-500 font-bold">
                  {formatPrice(product.price)}
                </p>
                <p className="text-sm text-gray-500">สต็อก: {product.stock}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}