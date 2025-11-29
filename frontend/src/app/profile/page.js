'use client';

/**
 * ===========================================
 * Profile Page
 * ===========================================
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isSeller, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    shop_name: '',
    shop_description: '',
  });
  const [showBecomeSeller, setShowBecomeSeller] = useState(false);
  const [sellerData, setSellerData] = useState({
    shop_name: '',
    shop_description: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile');
      return;
    }

    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        shop_name: user.shop_name || '',
        shop_description: user.shop_description || '',
      });
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data);
      toast.success('อัพเดทโปรไฟล์สำเร็จ');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('ไม่สามารถอัพเดทโปรไฟล์ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeSeller = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.becomeSeller(sellerData);
      updateUser(response.data.user);
      toast.success('เปลี่ยนเป็นผู้ขายสำเร็จ');
      setShowBecomeSeller(false);
    } catch (error) {
      console.error('Become seller error:', error);
      toast.error('ไม่สามารถเปลี่ยนเป็นผู้ขายได้');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">โปรไฟล์ของฉัน</h1>

      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-500 text-3xl font-bold">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="ml-4">
            <p className="font-bold text-lg">{user?.username}</p>
            <p className="text-gray-500">{user?.email}</p>
            <span
              className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                isSeller
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isSeller ? 'ผู้ขาย' : 'ผู้ซื้อ'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                นามสกุล
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ที่อยู่
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {isSeller && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อร้านค้า
                </label>
                <input
                  type="text"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียดร้านค้า
                </label>
                <textarea
                  name="shop_description"
                  value={formData.shop_description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </form>
      </div>

      {/* Become Seller Section */}
      {!isSeller && (
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">เปิดร้านค้า</h2>
          
          {!showBecomeSeller ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                อยากขายสินค้าบน MuangThai? เปิดร้านค้าได้ง่ายๆ
              </p>
              <button
                onClick={() => setShowBecomeSeller(true)}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                เปิดร้านค้าเลย
              </button>
            </div>
          ) : (
            <form onSubmit={handleBecomeSeller} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อร้านค้า *
                </label>
                <input
                  type="text"
                  value={sellerData.shop_name}
                  onChange={(e) =>
                    setSellerData({ ...sellerData, shop_name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียดร้านค้า
                </label>
                <textarea
                  value={sellerData.shop_description}
                  onChange={(e) =>
                    setSellerData({
                      ...sellerData,
                      shop_description: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'กำลังดำเนินการ...' : 'ยืนยันเปิดร้าน'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBecomeSeller(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}