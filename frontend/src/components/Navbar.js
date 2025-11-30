'use client';

/**
 * ===========================================
 * Navbar Component (with Chat Button)
 * ===========================================
 */
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useChat } from '@/contexts/ChatContext';
import { useState } from 'react';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiMessageCircle, FiPackage } from 'react-icons/fi';

export default function Navbar() {
  const { user, isAuthenticated, isSeller, logout } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount } = useChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="bg-primary-500 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 text-sm border-b border-primary-400">
          <div className="flex items-center space-x-4">
            {isSeller && (
              <Link href="/seller" className="hover:text-primary-100">
                ช่องทางผู้ขาย
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/notifications" className="hover:text-primary-100">
                  แจ้งเตือน
                </Link>
                <Link href="/orders" className="hover:text-primary-100">
                  คำสั่งซื้อของฉัน
                </Link>
                <Link href="/profile" className="hover:text-primary-100">
                  <span className="flex items-center">
                    <FiUser className="mr-1" />
                    {user?.username || user?.email}
                  </span>
                </Link>
                <button onClick={logout} className="hover:text-primary-100">
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link href="/register" className="hover:text-primary-100">
                  สมัครสมาชิก
                </Link>
                <Link href="/login" className="hover:text-primary-100">
                  เข้าสู่ระบบ
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Main navbar */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            MuangThai
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-sm text-gray-800 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 bg-primary-600 hover:bg-primary-700 rounded-r-sm"
              >
                <FiSearch />
              </button>
            </div>
          </form>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            {/* Chat - แสดงเฉพาะเมื่อ login */}
            {isAuthenticated && (
              <Link href="/chat" className="relative p-2 hover:bg-primary-600 rounded-lg">
                <FiMessageCircle className="text-2xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Orders - แสดงเฉพาะเมื่อ login */}
            {isAuthenticated && (
              <Link href="/orders" className="relative p-2 hover:bg-primary-600 rounded-lg" title="คำสั่งซื้อของฉัน">
                <FiPackage className="text-2xl" />
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-primary-600 rounded-lg">
              <FiShoppingCart className="text-2xl" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-primary-500 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden ml-4"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-primary-600 px-4 py-2">
          <Link href="/products" className="block py-2">
            สินค้าทั้งหมด
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/chat" className="block py-2">
                💬 แชท {unreadCount > 0 && `(${unreadCount})`}
              </Link>
              <Link href="/orders" className="block py-2">
                📦 คำสั่งซื้อของฉัน
              </Link>
              {isSeller && (
                <Link href="/seller" className="block py-2">
                  🏪 จัดการร้านค้า
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  );
}