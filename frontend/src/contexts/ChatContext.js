'use client';

/**
 * ===========================================
 * Chat Context (REST API Only - No WebSocket)
 * ===========================================
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { chatAPI } from '@/lib/chatApi';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ดึงรายการห้องแชท
  const fetchRooms = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await chatAPI.getRooms();
      setRooms(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  }, [isAuthenticated]);

  // ดึงจำนวนข้อความที่ยังไม่ได้อ่าน
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await chatAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [isAuthenticated]);

  // ดึงข้อความใหม่
  const fetchMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    
    try {
      const response = await chatAPI.getMessages(roomId);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);

  // เข้าห้องแชท
  const joinRoom = useCallback(async (roomId) => {
    setLoading(true);
    try {
      const [roomRes, messagesRes] = await Promise.all([
        chatAPI.getRoom(roomId),
        chatAPI.getMessages(roomId),
      ]);
      
      setCurrentRoom(roomRes.data);
      setMessages(messagesRes.data || []);
      
      // Mark messages as read
      await chatAPI.markRead(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ออกจากห้องแชท
  const leaveRoom = useCallback(() => {
    setCurrentRoom(null);
    setMessages([]);
  }, []);

  // ส่งข้อความ
  const sendMessage = useCallback(async (content, messageType = 'text', imageUrl = null, fileUrl = null) => {
    if (!currentRoom || !content.trim()) return;
    
    try {
      const response = await chatAPI.sendMessage(
        currentRoom.id,
        content,
        messageType,
        imageUrl,
        fileUrl
      );
      
      // เพิ่มข้อความใหม่ลงใน list
      setMessages((prev) => [...prev, response.data]);
      
      // อัพเดท rooms list
      fetchRooms();
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [currentRoom, fetchRooms]);

  // สร้างหรือเข้าห้องแชท
  const startChat = useCallback(async (participantId, productId = null, roomType = 'buyer_seller') => {
    try {
      const response = await chatAPI.createOrGetRoom(participantId, productId, roomType);
      const room = response.data;
      await joinRoom(room.id);
      return room;
    } catch (error) {
      console.error('Failed to start chat:', error);
      throw error;
    }
  }, [joinRoom]);

  // Polling ข้อความใหม่ทุก 3 วินาที (เมื่ออยู่ในห้องแชท)
  useEffect(() => {
    if (!currentRoom) return;
    
    const interval = setInterval(() => {
      fetchMessages(currentRoom.id);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [currentRoom, fetchMessages]);

  // Fetch rooms เมื่อ login
  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchRooms, fetchUnreadCount]);

  return (
    <ChatContext.Provider
      value={{
        rooms,
        currentRoom,
        messages,
        loading,
        unreadCount,
        isTyping: false,
        typingUser: null,
        onlineUsers: [],
        fetchRooms,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendTyping: () => {},
        startChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}