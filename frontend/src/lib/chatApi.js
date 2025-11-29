/**
 * ===========================================
 * Chat API Library
 * ===========================================
 */
import api from './api';

export const chatAPI = {
  // ดึงรายการห้องแชท
  getRooms: () => api.get('/chat/rooms/'),

  // ดึงห้องแชทโดย ID
  getRoom: (roomId) => api.get(`/chat/rooms/${roomId}/`),

  // สร้างหรือดึงห้องแชทที่มีอยู่
  createOrGetRoom: (participantId, productId = null, roomType = 'buyer_seller') =>
    api.post('/chat/rooms/create_or_get/', {
      participant_id: participantId,
      product_id: productId,
      room_type: roomType,
    }),

  // ดึงข้อความในห้องแชท
  getMessages: (roomId) => api.get(`/chat/rooms/${roomId}/messages/`),

  // ส่งข้อความ (REST API fallback)
  sendMessage: (roomId, content, messageType = 'text', imageUrl = null, fileUrl = null) =>
    api.post(`/chat/rooms/${roomId}/send/`, {
      content,
      message_type: messageType,
      image_url: imageUrl,
      file_url: fileUrl,
    }),

  // อ่านข้อความทั้งหมด
  markRead: (roomId) => api.post(`/chat/rooms/${roomId}/mark_read/`),

  // นับข้อความที่ยังไม่ได้อ่าน
  getUnreadCount: () => api.get('/chat/rooms/unread_count/'),
};