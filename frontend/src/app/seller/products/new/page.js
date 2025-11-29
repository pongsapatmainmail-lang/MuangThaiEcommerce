'use client';

/**
 * ===========================================
 * Add New Product Page (with Firebase Storage)
 * ===========================================
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { productsAPI } from '@/lib/api';
import { uploadMultipleImages } from '@/lib/uploadImage';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiLoader } from 'react-icons/fi';

export default function NewProductPage() {
  const router = useRouter();
  const { isAuthenticated, isSeller } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
  });
  const [images, setImages] = useState([]); // เก็บไฟล์
  const [previews, setPreviews] = useState([]); // เก็บ preview URLs
  const [uploadedUrls, setUploadedUrls] = useState([]); // เก็บ Firebase URLs

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/seller/products/new');
      return;
    }

    if (!isSeller) {
      router.push('/profile');
      return;
    }

    fetchCategories();
  }, [isAuthenticated, isSeller, router]);

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Preview images
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setPreviews(previews.filter((_, i) => i !== index));
    setImages(images.filter((_, i) => i !== index));
    setUploadedUrls(uploadedUrls.filter((_, i) => i !== index));
  };

  // อัพโหลดรูปไป Firebase ก่อน submit
  const handleUploadImages = async () => {
    if (images.length === 0) return [];

    setUploading(true);
    try {
      const urls = await uploadMultipleImages(images, 'products');
      setUploadedUrls(urls);
      toast.success('อัพโหลดรูปภาพสำเร็จ');
      return urls;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('อัพโหลดรูปภาพไม่สำเร็จ');
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // อัพโหลดรูปไป Firebase ก่อน
      let imageUrls = uploadedUrls;
      if (images.length > 0 && uploadedUrls.length === 0) {
        imageUrls = await handleUploadImages();
      }

      // ส่งข้อมูลไป Backend พร้อม URLs ของรูป
      const productData = {
        ...formData,
        image_urls: imageUrls, // ส่ง URLs แทนไฟล์
      };

      await productsAPI.create(productData);
      toast.success('เพิ่มสินค้าสำเร็จ');
      router.push('/seller');
    } catch (error) {
      console.error('Create product error:', error);
      toast.error(
        error.response?.data?.error || 'ไม่สามารถเพิ่มสินค้าได้'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !isSeller) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">เพิ่มสินค้าใหม่</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6">
        <div className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อสินค้า *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ระบุชื่อสินค้า"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หมวดหมู่ *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">เลือกหมวดหมู่</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียดสินค้า *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="อธิบายรายละเอียดสินค้า..."
            />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ราคา (บาท) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนในสต็อก *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รูปภาพสินค้า
            </label>
            
            {/* Image Previews */}
            {previews.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {previews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    {uploadedUrls[index] && (
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs text-center py-1 rounded-b-lg">
                        ✓ อัพโหลดแล้ว
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="text-center">
                <FiUpload className="mx-auto text-gray-400 text-2xl mb-2" />
                <p className="text-gray-500">คลิกเพื่อเลือกรูปภาพ</p>
                <p className="text-gray-400 text-sm">PNG, JPG up to 5MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {/* Upload to Firebase Button */}
            {images.length > 0 && uploadedUrls.length === 0 && (
              <button
                type="button"
                onClick={handleUploadImages}
                disabled={uploading}
                className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    กำลังอัพโหลด...
                  </>
                ) : (
                  <>
                    <FiUpload className="mr-2" />
                    อัพโหลดรูปภาพไป Firebase
                  </>
                )}
              </button>
            )}
          </div>

          {/* Submit */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังบันทึก...' : 'เพิ่มสินค้า'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}