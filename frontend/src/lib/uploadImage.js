/**
 * ===========================================
 * Firebase Storage Upload Utility
 * ===========================================
 */
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * อัพโหลดรูปภาพไปยัง Firebase Storage
 * @param {File} file - ไฟล์รูปภาพ
 * @param {string} folder - โฟลเดอร์ที่จะเก็บ (เช่น 'products', 'avatars')
 * @returns {Promise<string>} - URL ของรูปภาพ
 */
export async function uploadImage(file, folder = 'products') {
  try {
    // สร้างชื่อไฟล์ unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomString}.${extension}`;

    // สร้าง reference
    const storageRef = ref(storage, fileName);

    // อัพโหลดไฟล์
    const snapshot = await uploadBytes(storageRef, file);

    // ดึง URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('ไม่สามารถอัพโหลดรูปภาพได้');
  }
}

/**
 * อัพโหลดหลายรูปภาพ
 * @param {File[]} files - array ของไฟล์รูปภาพ
 * @param {string} folder - โฟลเดอร์ที่จะเก็บ
 * @returns {Promise<string[]>} - array ของ URLs
 */
export async function uploadMultipleImages(files, folder = 'products') {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}