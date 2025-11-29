'use client';

/**
 * ===========================================
 * Cart Icon Component
 * ===========================================
 */
import Link from 'next/link';
import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';

export default function CartIcon() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" className="relative">
      <FiShoppingCart className="text-2xl" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
}