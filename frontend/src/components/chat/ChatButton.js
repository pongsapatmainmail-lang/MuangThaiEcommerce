'use client';

/**
 * ===========================================
 * Chat Button Component
 * สำหรับเริ่มแชทจากหน้าสินค้า
 * ===========================================
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ChatButton({ sellerId, productId, sellerName, className = '' }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { startChat } = useChat();
  const [loading, setLoading] = useState(false);

  // ไม่แสดงปุ่มถ้าเป็นสินค้าของตัวเอง
  if (user?.id === sellerId) {
    return null;
  }

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    setLoading(true);
    try {
      const room = await startChat(sellerId, productId, 'buyer_seller');
      router.push(`/chat?room=${room.id}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('ไม่สามารถเริ่มแชทได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center justify-center px-4 py-2 border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <FiMessageCircle className="mr-2" />
      {loading ? 'กำลังโหลด...' : `แชทกับ ${sellerName || 'ผู้ขาย'}`}
    </button>
  );
}