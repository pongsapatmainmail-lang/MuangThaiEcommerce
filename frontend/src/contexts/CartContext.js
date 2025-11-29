'use client';

/**
 * ===========================================
 * Cart Context
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
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // โหลด cart จาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart:', error);
      }
    }
  }, []);

  // บันทึก cart ลง localStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Sync กับ server เมื่อ login
  useEffect(() => {
    if (isAuthenticated && items.length > 0) {
      syncWithServer();
    }
  }, [isAuthenticated]);

  // Sync cart กับ server
  const syncWithServer = async () => {
    try {
      const cartItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));
      const response = await cartAPI.sync(cartItems);
      // อัพเดท cart จาก server response
      if (response.data.cart?.items) {
        setItems(response.data.cart.items);
      }
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  };

  // เพิ่มสินค้า
  const addItem = async (product, quantity = 1) => {
    setLoading(true);
    try {
      const existingIndex = items.findIndex(
        (item) => item.product.id === product.id
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
        await cartAPI.add(product.id, quantity);
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
      items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );

    if (isAuthenticated) {
      const item = items.find((i) => i.product.id === productId);
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
    const item = items.find((i) => i.product.id === productId);
    setItems(items.filter((i) => i.product.id !== productId));

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
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const value = {
    items,
    loading,
    totalItems,
    totalPrice,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    syncWithServer,
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