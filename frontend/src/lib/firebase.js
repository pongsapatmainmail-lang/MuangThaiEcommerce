/**
 * ===========================================
 * Firebase Configuration
 * ===========================================
 */
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// TODO: ใส่ config จาก Firebase Console ของคุณ
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "muangthai-shop.firebaseapp.com",
  projectId: "muangthai-shop",
  storageBucket: "muangthai-shop.firebasestorage.app",
  messagingSenderId: "915241940924",
  appId: "1:915241940924:web:c784a69f985cabf6ab5db9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Storage
export const storage = getStorage(app);

export default app;