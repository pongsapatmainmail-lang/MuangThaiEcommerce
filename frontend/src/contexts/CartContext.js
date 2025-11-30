'use client';

/**
 * ===========================================
 * Cart Context - Fixed Version
 * ===========================================
 * ใช้ localStorage สำหรับ guest และ sync กับ server เมื่อ login
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'shopee_cart';

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // โหลด cart จาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Failed to parse cart:', error);
        }
      }
      setInitialized(true);
    }
  }, []);

  // บันทึก cart ลง localStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, initialized]);

  // Sync กับ server เมื่อ login
  useEffect(() => {
    if (!authLoading && isAuthenticated && initialized && items.length > 0) {
      syncWithServer();
    }
  }, [isAuthenticated, authLoading, initialized]);

  // Sync cart กับ server
  const syncWithServer = async () => {
    try {
      // เพิ่มสินค้าทีละรายการไปยัง server
      for (const item of items) {
        try {
          await cartAPI.addItem(item.product.id, item.quantity);
        } catch (error) {
          // ข้ามถ้าเพิ่มไม่ได้ (อาจมีอยู่แล้ว)
          console.log('Item may already exist in cart:', item.product.id);
        }
      }
      
      // ดึง cart จาก server
      const response = await cartAPI.get();
      if (response.data?.items) {
        setItems(response.data.items);
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  };

  // โหลด cart จาก server
  const loadFromServer = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await cartAPI.get();
      if (response.data?.items) {
        setItems(response.data.items);
      }
    } catch (error) {
      console.error('Failed to load cart from server:', error);
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มสินค้า
  const addItem = async (product, quantity = 1) => {
    setLoading(true);
    try {
      const existingIndex = items.findIndex(
        (item) => item.product?.id === product.id || item.product_id === product.id
      );

      if (existingIndex >= 0) {
        // มีอยู่แล้ว - เพิ่มจำนวน
        const newItems = [...items];
        newItems[existingIndex].quantity += quantity;
        setItems(newItems);
      } else {
        // ยังไม่มี - เพิ่มใหม่
        setItems([...items, { product, quantity }]);
      }

      // Sync กับ server ถ้า login แล้ว
      if (isAuthenticated) {
        try {
          await cartAPI.addItem(product.id, quantity);
        } catch (error) {
          console.error('Failed to add item to server:', error);
        }
      }

      toast.success('เพิ่มสินค้าในตะกร้าแล้ว');
    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error('ไม่สามารถเพิ่มสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  // อัพเดทจำนวน
  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }

    setItems(
      items.map((item) => {
        const itemProductId = item.product?.id || item.product_id;
        return itemProductId === productId ? { ...item, quantity } : item;
      })
    );

    if (isAuthenticated) {
      const item = items.find((i) => {
        const itemProductId = i.product?.id || i.product_id;
        return itemProductId === productId;
      });
      if (item?.id) {
        try {
          await cartAPI.updateItem(item.id, quantity);
        } catch (error) {
          console.error('Failed to update quantity:', error);
        }
      }
    }
  };

  // ลบสินค้า
  const removeItem = async (productId) => {
    const item = items.find((i) => {
      const itemProductId = i.product?.id || i.product_id;
      return itemProductId === productId;
    });
    
    setItems(items.filter((i) => {
      const itemProductId = i.product?.id || i.product_id;
      return itemProductId !== productId;
    }));

    if (isAuthenticated && item?.id) {
      try {
        await cartAPI.removeItem(item.id);
      } catch (error) {
        console.error('Failed to remove item:', error);
      }
    }

    toast.success('ลบสินค้าออกจากตะกร้าแล้ว');
  };

  // ล้างตะกร้า
  const clearCart = async () => {
    setItems([]);

    if (isAuthenticated) {
      try {
        await cartAPI.clear();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  // คำนวณยอดรวม
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = item.product?.price || item.price || 0;
    return sum + price * (item.quantity || 0);
  }, 0);

  const value = {
    items,
    loading,
    totalItems,
    totalPrice,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    loadFromServer,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}