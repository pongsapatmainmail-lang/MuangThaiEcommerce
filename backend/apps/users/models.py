"""
===========================================
Users App - Models
===========================================
Custom User Model รองรับ Buyer และ Seller
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User Model
    - เพิ่ม field สำหรับ role (buyer/seller)
    - เพิ่ม phone, address, avatar
    """
    
    class Role(models.TextChoices):
        BUYER = 'buyer', 'ผู้ซื้อ'
        SELLER = 'seller', 'ผู้ขาย'
    
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='เบอร์โทรศัพท์')
    address = models.TextField(blank=True, null=True, verbose_name='ที่อยู่')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='รูปโปรไฟล์')
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.BUYER,
        verbose_name='บทบาท'
    )
    shop_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='ชื่อร้านค้า')
    shop_description = models.TextField(blank=True, null=True, verbose_name='รายละเอียดร้านค้า')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='สร้างเมื่อ')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='อัพเดทเมื่อ')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'ผู้ใช้'
        verbose_name_plural = 'ผู้ใช้'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    @property
    def is_seller(self):
        return self.role == self.Role.SELLER
    
    @property
    def is_buyer(self):
        return self.role == self.Role.BUYER