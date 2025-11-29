'use client';

/**
 * ===========================================
 * Orders Page
 * ===========================================
 */
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ordersAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const statusLabels = {
  pending: { label: 'รอชำระเงิน', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'ชำระเงินแล้ว', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'จัดส่งแล้ว', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'ได้รับสินค้าแล้ว', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800' },
};

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isSeller } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('buyer');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/orders');
      return;
    }

    fetchOrders();

    // Show success message for new order
    const newOrderId = searchParams.get('new');
    if (newOrderId) {
      toast.success(`คำสั่งซื้อ #${newOrderId} ถูกสร้างแล้ว`);
    }
  }, [isAuthenticated, role, router, searchParams]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.getAll({ role });
      setOrders(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (orderId) => {
    try {
      await ordersAPI.mockPayment(orderId, true);
      toast.success('ชำระเงินสำเร็จ');
      fetchOrders();
    } catch (error) {
      toast.error('ชำระเงินไม่สำเร็จ');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      toast.success('อัพเดทสถานะสำเร็จ');
      fetchOrders();
    } catch (error) {
      toast.error('อัพเดทสถานะไม่สำเร็จ');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">คำสั่งซื้อ</h1>

        {isSeller && (
          <div className="flex space-x-2">
            <button
              onClick={() => setRole('buyer')}
              className={`px-4 py-2 rounded-lg ${
                role === 'buyer'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              การซื้อของฉัน
            </button>
            <button
              onClick={() => setRole('seller')}
              className={`px-4 py-2 rounded-lg ${
                role === 'seller'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              การขายของฉัน
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 text-lg mb-4">ยังไม่มีคำสั่งซื้อ</p>
          <Link
            href="/products"
            className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            เลือกซื้อสินค้า
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold">#{order.order_number}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusLabels[order.status]?.color
                  }`}
                >
                  {statusLabels[order.status]?.label}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">
                    {order.items_count} รายการ
                  </p>
                  <p className="text-lg font-bold text-primary-500">
                    {formatPrice(order.total)}
                  </p>
                </div>

                <div className="flex space-x-2">
                  {/* Buyer actions */}
                  {role === 'buyer' && order.status === 'pending' && (
                    <button
                      onClick={() => handlePayment(order.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      ชำระเงิน
                    </button>
                  )}

                  {/* Seller actions */}
                  {role === 'seller' && order.status === 'paid' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'shipped')}
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      จัดส่งแล้ว
                    </button>
                  )}

                  {role === 'buyer' && order.status === 'shipped' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      ได้รับสินค้าแล้ว
                    </button>
                  )}

                  <Link
                    href={`/orders/${order.id}`}
                    className="px-4 py-2 border border-primary-500 text-primary-500 rounded hover:bg-primary-50"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">กำลังโหลด...</div>}>
      <OrdersContent />
    </Suspense>
  );
}