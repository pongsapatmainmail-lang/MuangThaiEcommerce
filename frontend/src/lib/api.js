/**
 * ===========================================
 * API Client Library
 * ===========================================
 */
import axios from 'axios';
import Cookies from 'js-cookie';

// สร้าง axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - เพิ่ม token ในทุก request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - จัดการ token หมดอายุ
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ถ้า 401 และยังไม่ได้ retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/token/refresh/`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          Cookies.set('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token หมดอายุ - logout
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ===========================================
// Auth API
// ===========================================
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  becomeSeller: (data) => api.post('/auth/become-seller/', data),
};

// ===========================================
// Products API
// ===========================================
export const productsAPI = {
  getAll: (params) => api.get('/products/', { params }),
  getById: (id) => api.get(`/products/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'images' && Array.isArray(data[key])) {
        data[key].forEach((file) => formData.append('images', file));
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => api.patch(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  getMyProducts: () => api.get('/products/my-products/'),
  getCategories: () => api.get('/products/categories/'),
};

// ===========================================
// Cart API
// ===========================================
export const cartAPI = {
  get: () => api.get('/cart/'),
  sync: (items) => api.post('/cart/sync/', { items }),
  add: (productId, quantity = 1) =>
    api.post('/cart/add/', { product_id: productId, quantity }),
  updateItem: (itemId, quantity) =>
    api.put(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
  clear: () => api.delete('/cart/'),
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
};

// ===========================================
// Reviews API
// ===========================================
export const reviewsAPI = {
  getByProduct: (productId) => api.get('/reviews/', { params: { product: productId } }),
  create: (data) => api.post('/reviews/', data),
  delete: (id) => api.delete(`/reviews/${id}/`),
};

// ===========================================
// Notifications API
// ===========================================
export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/mark-read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
};

export default api;