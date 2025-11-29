'use client';

/**
 * ===========================================
 * Auth Context
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
      if (token) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access, refresh, user: userData } = response.data;

    Cookies.set('access_token', access, { expires: 1 }); // 1 day
    Cookies.set('refresh_token', refresh, { expires: 7 }); // 7 days
    setUser(userData);

    return userData;
  };

  // Register
  const register = async (data) => {
    const response = await authAPI.register(data);
    const { tokens, user: userData } = response.data;

    Cookies.set('access_token', tokens.access, { expires: 1 });
    Cookies.set('refresh_token', tokens.refresh, { expires: 7 });
    setUser(userData);

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
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
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
    isSeller: user?.role === 'seller',
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