'use client';

/**
 * ===========================================
 * Products List Page
 * ===========================================
 */
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import { productsAPI } from '@/lib/api';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsAPI.getCategories();
        setCategories(response.data || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          page: 1,
          search: searchParams.get('search') || undefined,
          category: searchParams.get('category') || undefined,
          min_price: searchParams.get('min_price') || undefined,
          max_price: searchParams.get('max_price') || undefined,
        };

        const response = await productsAPI.getAll(params);
        setProducts(response.data.results || []);
        setHasMore(!!response.data.next);
        setPage(1);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const params = {
        page: page + 1,
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        min_price: searchParams.get('min_price') || undefined,
        max_price: searchParams.get('max_price') || undefined,
      };

      const response = await productsAPI.getAll(params);
      setProducts([...products, ...(response.data.results || [])]);
      setHasMore(!!response.data.next);
      setPage(page + 1);
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">สินค้าทั้งหมด</h1>

      <SearchBar categories={categories} />

      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg h-72 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">ไม่พบสินค้า</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">กำลังโหลด...</div>}>
      <ProductsContent />
    </Suspense>
  );
}