'use client';

/**
 * ===========================================
 * Chat Sidebar Component
 * ===========================================
 */
import { useEffect, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { FiSearch, FiMessageCircle } from 'react-icons/fi';

export default function ChatSidebar() {
  const { rooms, currentRoom, joinRoom, fetchRooms } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      await fetchRooms();
      setIsLoading(false);
    };
    loadRooms();
  }, [fetchRooms]);

  const filteredRooms = rooms.filter((room) => {
    const otherName = room.other_participant?.shop_name || room.other_participant?.username || '';
    const productName = room.product_name || '';
    return (
      otherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // ถ้าน้อยกว่า 24 ชั่วโมง แสดงเวลา
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
    // ถ้าน้อยกว่า 7 วัน แสดงวัน
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('th-TH', { weekday: 'short' });
    }
    // อื่นๆ แสดงวันที่
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">แชท</h2>
        
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาแชท..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <FiMessageCircle size={48} className="mb-4" />
            <p className="text-center">ยังไม่มีแชท</p>
            <p className="text-sm text-center mt-2">
              เริ่มแชทได้โดยกดปุ่ม "แชทกับผู้ขาย" ที่หน้าสินค้า
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => joinRoom(room.id)}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors ${
                  currentRoom?.id === room.id ? 'bg-primary-50' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                    {(room.other_participant?.shop_name || room.other_participant?.username || '?')[0].toUpperCase()}
                  </div>
                  {room.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                      {room.unread_count > 9 ? '9+' : room.unread_count}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium truncate">
                      {room.other_participant?.shop_name || room.other_participant?.username}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {formatTime(room.last_message?.created_at || room.updated_at)}
                    </span>
                  </div>
                  
                  {room.product_name && (
                    <p className="text-xs text-primary-500 truncate mb-1">
                      📦 {room.product_name}
                    </p>
                  )}
                  
                  <p className={`text-sm truncate ${room.unread_count > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                    {room.last_message?.content || 'ยังไม่มีข้อความ'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}