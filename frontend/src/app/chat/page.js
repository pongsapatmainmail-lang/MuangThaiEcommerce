'use client';

/**
 * ===========================================
 * Chat Page
 * ===========================================
 */
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { FiMessageCircle } from 'react-icons/fi';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { rooms, currentRoom, joinRoom, leaveRoom, loading } = useChat();
  const [isMobileView, setIsMobileView] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/chat');
    }
  }, [authLoading, isAuthenticated, router]);

  // Join room from URL params
  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId && !loading) {
      joinRoom(parseInt(roomId));
    }
  }, [searchParams, joinRoom, loading]);

  // Handle responsive view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 150px)' }}>
        <div className="flex h-full">
          {/* Sidebar - รายการแชท */}
          <div
            className={`${
              isMobileView && currentRoom ? 'hidden' : 'w-full md:w-1/3 lg:w-1/4'
            } border-r`}
          >
            <ChatSidebar />
          </div>

          {/* Chat Window */}
          <div
            className={`${
              isMobileView && !currentRoom ? 'hidden' : 'flex-1'
            } flex flex-col`}
          >
            {currentRoom ? (
              <ChatWindow onBack={isMobileView ? leaveRoom : undefined} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <FiMessageCircle size={64} className="mb-4" />
                <p className="text-xl">เลือกแชทเพื่อเริ่มสนทนา</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}