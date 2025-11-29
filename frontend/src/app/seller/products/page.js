'use client';

/**
 * ===========================================
 * Seller Products Management Page
 * ===========================================
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { productsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

export default function SellerProductsPage() {
  const router = useRouter();
  const { isAuthenticated, isSeller } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/seller/products');
      return;
    }

    if (!isSeller) {
      router.push('/profile');
      return;
    }

    fetchProducts();
  }, [isAuthenticated, isSeller, router]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getMyProducts();
      setProducts(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('คุณต้องการลบสินค้านี้หรือไม่?')) {
      return;
    }

    try {
      await productsAPI.delete(productId);
      toast.success('ลบสินค้าสำเร็จ');
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('ไม่สามารถลบสินค้าได้');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(price);
  };

  if (!isAuthenticated || !isSeller) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">จัดการสินค้า</h1>
        <Link
          href="/seller/products/new"
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          <FiPlus className="mr-2" />
          เพิ่มสินค้าใหม่
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      ) : !Array.isArray(products) || products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500 text-lg mb-4">ยังไม่มีสินค้า</p>
          <Link
            href="/seller/products/new"
            className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            เพิ่มสินค้าแรก
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  สินค้า
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  ราคา
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  สต็อก
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  สถานะ
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="relative w-12 h-12 bg-gray-100 rounded mr-3">
                        {product.main_image ? (
                          <Image
                            src={product.main_image}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            ไม่มีรูป
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.category_name || 'ไม่มีหมวดหมู่'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-primary-500 font-bold">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`${
                        product.stock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.is_active ? 'เปิดขาย' : 'ปิดขาย'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/seller/products/${product.id}/edit`}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <FiEdit />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}