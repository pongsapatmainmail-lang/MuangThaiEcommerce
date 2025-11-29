import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ChatProvider } from '@/contexts/ChatContext';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata = {
  title: 'MuangThai - ช้อปออนไลน์',
  description: 'แพลตฟอร์มอีคอมเมิร์ซที่ดีที่สุด',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <CartProvider>
            <ChatProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <footer className="bg-gray-800 text-white py-8">
                  <div className="max-w-7xl mx-auto px-4 text-center">
                    <p>&copy; 2024 MuangThai. สร้างเพื่อการเรียนรู้</p>
                  </div>
                </footer>
              </div>
              <Toaster position="top-right" />
            </ChatProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}