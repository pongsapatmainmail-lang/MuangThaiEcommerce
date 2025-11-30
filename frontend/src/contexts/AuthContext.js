'use client';

/**
 * ===========================================
 * Auth Context - Fixed Version
 * ===========================================
 */
import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // โหลด user เมื่อเริ่มต้น
  useEffect(() => {
    const loadUser = async () => {
      const token = Cookies.get('access_token');
      console.log('Loading user, token exists:', !!token);
      
      if (token) {
        try {
          const response = await authAPI.getProfile();
          console.log('Profile loaded:', response.data);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          
          // ลอง refresh token
          const refreshToken = Cookies.get('refresh_token');
          if (refreshToken) {
            try {
              const refreshResponse = await authAPI.refreshToken(refreshToken);
              const newAccess = refreshResponse.data.access;
              Cookies.set('access_token', newAccess, { expires: 1 });
              
              // ลองดึง profile อีกครั้ง
              const profileResponse = await authAPI.getProfile();
              setUser(profileResponse.data);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              Cookies.remove('access_token');
              Cookies.remove('refresh_token');
            }
          } else {
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    console.log('Login response:', response.data);
    
    const { access, refresh, user: userData } = response.data;

    // บันทึก tokens
    Cookies.set('access_token', access, { expires: 1 });
    Cookies.set('refresh_token', refresh, { expires: 7 });
    
    // บันทึกลง localStorage ด้วยเพื่อให้ api.js ใช้ได้
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
    
    setUser(userData);
    return userData;
  };

  // Register
  const register = async (data) => {
    const response = await authAPI.register(data);
    console.log('Register response:', response.data);
    
    // รองรับหลาย format ของ response
    let access, refresh, userData;
    
    if (response.data.tokens) {
      // Format: { tokens: { access, refresh }, user: {...} }
      access = response.data.tokens.access;
      refresh = response.data.tokens.refresh;
      userData = response.data.user;
    } else if (response.data.access) {
      // Format: { access, refresh, user: {...} }
      access = response.data.access;
      refresh = response.data.refresh;
      userData = response.data.user;
    } else {
      // ไม่มี token - อาจต้อง login หลัง register
      return response.data;
    }

    // บันทึก tokens
    if (access && refresh) {
      Cookies.set('access_token', access, { expires: 1 });
      Cookies.set('refresh_token', refresh, { expires: 7 });
      
      // บันทึกลง localStorage ด้วย
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
      }
      
      setUser(userData);
    }

    return userData;
  };

  // Logout
  const logout = async () => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ลบ tokens จากทั้ง Cookies และ localStorage
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      
      setUser(null);
    }
  };

  // Update user
  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isSeller: user?.role === 'seller' || user?.is_seller,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}