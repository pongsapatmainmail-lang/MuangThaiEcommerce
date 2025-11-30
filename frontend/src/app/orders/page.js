'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
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
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { role: 'buyer' };
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">คำสั่งซื้อของฉัน</h1>
          <p className="text-gray-600 mt-1">ดูประวัติและติดตามคำสั่งซื้อ</p>
        </div>

        {/* Filter */}
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
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่มีคำสั่งซื้อ</h3>
            <p className="mt-2 text-gray-500">คุณยังไม่มีคำสั่งซื้อ</p>
            <Link
              href="/products"
              className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              เริ่มช้อปปิ้ง
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-gray-600">คำสั่งซื้อ: </span>
                    <span className="font-semibold text-gray-900">
                      {order.order_number || `#${order.id}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(order.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                    >
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{item.product_name}</p>
                        <p className="text-gray-500 text-sm">
                          ฿{parseFloat(item.price || item.product_price).toLocaleString()} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ฿{((item.price || item.product_price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t flex flex-wrap items-center justify-between gap-4">
                  <div className="text-right">
                    <span className="text-gray-600">ยอดรวม: </span>
                    <span className="text-xl font-bold text-orange-500">
                      ฿{parseFloat(order.total_amount || order.total || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewPDF(order.id)}
                      disabled={downloadingId === order.id}
                      className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      ดูใบสั่งซื้อ
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(order.id)}
                      disabled={downloadingId === order.id}
                      className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                    >
                      {downloadingId === order.id ? (
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      )}
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