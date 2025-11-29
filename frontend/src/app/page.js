'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { productsAPI } from '@/lib/api';
import { FiArrowRight } from 'react-icons/fi';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // เริ่มต้นเป็น array ว่าง
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productsAPI.getAll({ page_size: 8 }),
          productsAPI.getCategories(),
        ]);
        
        // ตรวจสอบว่าเป็น array หรือไม่
        setProducts(productsRes.data?.results || productsRes.data || []);
        setCategories(categoriesRes.data?.results || categoriesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            ยินดีต้อนรับสู่ MuangThai
          </h1>
          <p className="text-xl mb-8">
            ช้อปสินค้าคุณภาพ ราคาดี จัดส่งรวดเร็ว
          </p>
          <Link
            href="/products"
            className="inline-flex items-center bg-white text-primary-500 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
          >
            เริ่มช้อปเลย
            <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">หมวดหมู่สินค้า</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-2">📦</div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-gray-500">
                    {category.product_count || 0} สินค้า
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 col-span-full text-center">
                ยังไม่มีหมวดหมู่
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">สินค้าแนะนำ</h2>
            <Link
              href="/products"
              className="text-primary-500 hover:underline flex items-center"
            >
              ดูทั้งหมด
              <FiArrowRight className="ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-72 animate-pulse" />
              ))}
            </div>
          ) : Array.isArray(products) && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">ยังไม่มีสินค้า</p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-bold mb-2">จัดส่งรวดเร็ว</h3>
              <p className="text-gray-600">ส่งถึงมือคุณภายใน 1-3 วัน</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💯</div>
              <h3 className="text-xl font-bold mb-2">สินค้าคุณภาพ</h3>
              <p className="text-gray-600">รับประกันคุณภาพทุกชิ้น</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">ปลอดภัย</h3>
              <p className="text-gray-600">การชำระเงินที่ปลอดภัย</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}