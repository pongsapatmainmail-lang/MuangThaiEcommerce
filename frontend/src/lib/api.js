/**
 * ===========================================
 * API Configuration - Fixed Version
 * ===========================================
 */
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - เพิ่ม token
api.interceptors.request.use(
  (config) => {
    let token = null;
    
    if (typeof window !== 'undefined') {
      token = Cookies.get('access_token') || localStorage.getItem('access_token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - จัดการ token expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refresh_token') || localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/users/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          
          Cookies.set('access_token', access, { expires: 1 });
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access);
          }

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ===========================================
// Auth API
// ===========================================
export const authAPI = {
  register: (data) => api.post('/users/register/', data),
  login: (data) => api.post('/users/login/', data),
  logout: (refresh) => api.post('/users/logout/', { refresh }),
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) => api.patch('/users/profile/', data),
  refreshToken: (refresh) => api.post('/users/token/refresh/', { refresh }),
};

// ===========================================
// Products API
// ===========================================
export const productsAPI = {
  getAll: (params) => api.get('/products/', { params }),
  getById: (id) => api.get(`/products/${id}/`),
  getBySlug: (slug) => api.get(`/products/slug/${slug}/`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.patch(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  getCategories: () => api.get('/products/categories/'),
  
  // Seller Products - ใช้ my-products endpoint
  getMyProducts: (params) => api.get('/products/my-products/', { params }),
  getSellerProducts: (sellerId, params) => api.get('/products/', { params: { ...params, seller: sellerId } }),
};

// ===========================================
// Cart API
// ===========================================
export const cartAPI = {
  get: () => api.get('/cart/'),
  addItem: (productId, quantity = 1) =>
    api.post('/cart/add/', { product_id: productId, quantity }),
  updateItem: (itemId, quantity) =>
    api.put(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
  clear: () => api.delete('/cart/clear/'),
  sync: (items) => api.post('/cart/sync/', { items }),
};

// ===========================================
// Orders API
// ===========================================
export const ordersAPI = {
  getAll: (params) => api.get('/orders/', { params }),
  getById: (id) => api.get(`/orders/${id}/`),
  create: (data) => api.post('/orders/', data),
  updateStatus: (id, status) =>
    api.post(`/orders/${id}/update-status/`, { status }),
  mockPayment: (id, success = true) =>
    api.post(`/orders/${id}/mock-payment/`, { success }),
  downloadPDF: (id) =>
    api.get(`/orders/${id}/download-pdf/`, { responseType: 'blob' }),
  viewPDF: (id) =>
    api.get(`/orders/${id}/view-pdf/`, { responseType: 'blob' }),
  getSellerOrders: (params) => api.get('/orders/', { params: { ...params, role: 'seller' } }),
};

// ===========================================
// Reviews API
// ===========================================
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews/', { params }),
  getByProduct: (productId) => api.get('/reviews/', { params: { product: productId } }),
  create: (data) => api.post('/reviews/', data),
  update: (id, data) => api.patch(`/reviews/${id}/`, data),
  delete: (id) => api.delete(`/reviews/${id}/`),
};

// ===========================================
// Notifications API
// ===========================================
export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  getUnread: () => api.get('/notifications/', { params: { read: false } }),
  markAsRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllAsRead: () => api.post('/notifications/read-all/'),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
};

// ===========================================
// Chat API
// ===========================================
export const chatAPI = {
  getRooms: () => api.get('/chat/rooms/'),
  getRoom: (id) => api.get(`/chat/rooms/${id}/`),
  createOrGetRoom: (participantId, productId, roomType = 'buyer_seller') =>
    api.post('/chat/rooms/create_or_get/', {
      participant_id: participantId,
      product_id: productId,
      room_type: roomType,
    }),
  getMessages: (roomId) => api.get(`/chat/rooms/${roomId}/messages/`),
  sendMessage: (roomId, content, messageType = 'text') =>
    api.post(`/chat/rooms/${roomId}/send/`, {
      content,
      message_type: messageType,
    }),
  markRead: (roomId) => api.post(`/chat/rooms/${roomId}/mark_read/`),
  getUnreadCount: () => api.get('/chat/rooms/unread_count/'),
};

// ===========================================
// Seller API
// ===========================================
export const sellerAPI = {
  getProducts: (params) => api.get('/products/my-products/', { params }),
  getOrders: (params) => api.get('/orders/', { params: { ...params, role: 'seller' } }),
};

export default api;