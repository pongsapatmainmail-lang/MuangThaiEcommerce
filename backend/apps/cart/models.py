"""
===========================================
Cart App - Models
===========================================
ตะกร้าสินค้าบน Server (sync กับ localStorage ใน frontend)
"""
from django.conf import settings
from django.db import models

from apps.products.models import Product


class Cart(models.Model):
    """ตะกร้าสินค้าของผู้ใช้"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart',
        verbose_name='ผู้ใช้'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='สร้างเมื่อ')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='อัพเดทเมื่อ')
    
    class Meta:
        verbose_name = 'ตะกร้าสินค้า'
        verbose_name_plural = 'ตะกร้าสินค้า'
    
    def __str__(self):
        return f"Cart - {self.user.email}"
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())
    
    @property
    def total_price(self):
        return sum(item.total for item in self.items.all())


class CartItem(models.Model):
    """รายการสินค้าในตะกร้า"""
    
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='ตะกร้า'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='สินค้า'
    )
    quantity = models.PositiveIntegerField(default=1, verbose_name='จำนวน')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='สร้างเมื่อ')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='อัพเดทเมื่อ')
    
    class Meta:
        verbose_name = 'รายการในตะกร้า'
        verbose_name_plural = 'รายการในตะกร้า'
        unique_together = ['cart', 'product']
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    
    @property
    def total(self):
        return self.product.price * self.quantity