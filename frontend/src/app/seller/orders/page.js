import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function SellerOrdersPage() {
  const { user, loading: authLoading, isSeller } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const statusOptions = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'confirmed', label: 'ยืนยันแล้ว' },
    { value: 'paid', label: 'ชำระเงินแล้ว' },
    { value: 'shipped', label: 'จัดส่งแล้ว' },
    { value: 'delivered', label: 'ส่งถึงแล้ว' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-200 text-green-900',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!isSeller) {
        router.push('/');
        return;
      }
      fetchOrders();
    }
  }, [user, authLoading, isSeller, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { role: 'seller' };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await api.get('/orders/', { params });
      setOrders(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('ไม่สามารถโหลดรายการคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (orderId) => {
    try {
      setDownloadingId(orderId);
      const response = await api.get(`/orders/${orderId}/download-pdf/`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order_${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('ไม่สามารถดาวน์โหลด PDF ได้');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewPDF = async (orderId) => {
    try {
      setDownloadingId(orderId);
      const response = await api.get(`/orders/${orderId}/view-pdf/`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error viewing PDF:', err);
      alert('ไม่สามารถเปิด PDF ได้');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.post(`/orders/${orderId}/update-status/`, {
        status: newStatus,
      });
      fetchOrders();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('ไม่สามารถอัพเดทสถานะได้');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">คำสั่งซื้อของร้าน</h1>
          <p className="text-gray-600 mt-1">จัดการคำสั่งซื้อและดาวน์โหลดใบสั่งซื้อ</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-gray-700 font-medium">กรองสถานะ:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={fetchOrders}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              รีเฟรช
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่มีคำสั่งซื้อ</h3>
            <p className="mt-2 text-gray-500">ยังไม่มีคำสั่งซื้อสินค้าของคุณ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-gray-600">หมายเลขคำสั่งซื้อ: </span>
                    <span className="font-semibold text-gray-900">{order.order_number || `#${order.id}`}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(order.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">ข้อมูลผู้ซื้อ</h4>
                    <p className="text-gray-900">{order.shipping_name || order.buyer_name}</p>
                    <p className="text-gray-600 text-sm">{order.shipping_phone}</p>
                    <p className="text-gray-600 text-sm">{order.shipping_address}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">รายการสินค้า</h4>
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          {item.product_image && (
                            <img src={item.product_image} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="text-gray-900">{item.product_name}</p>
                            <p className="text-gray-500 text-sm">x{item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium text-gray-900">
                          ฿{((item.price || item.product_price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end border-t pt-4">
                    <div className="text-right">
                      <p className="text-gray-500">ยอดรวมทั้งหมด</p>
                      <p className="text-2xl font-bold text-orange-500">
                        ฿{parseFloat(order.total_amount || order.total || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">เปลี่ยนสถานะ:</label>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="pending">รอดำเนินการ</option>
                      <option value="confirmed">ยืนยันแล้ว</option>
                      <option value="paid">ชำระเงินแล้ว</option>
                      <option value="shipped">จัดส่งแล้ว</option>
                      <option value="delivered">ส่งถึงแล้ว</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewPDF(order.id)}
                      disabled={downloadingId === order.id}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      ดู PDF
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(order.id)}
                      disabled={downloadingId === order.id}
                      className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                    >
                      ดาวน์โหลด PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
ENDOFFILE