"""
===========================================
Reviews App - Models
===========================================
"""
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.products.models import Product


class Review(models.Model):
    """รีวิวสินค้า"""
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='สินค้า'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='ผู้รีวิว'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='คะแนน'
    )
    comment = models.TextField(verbose_name='ความคิดเห็น')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='สร้างเมื่อ')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='อัพเดทเมื่อ')
    
    class Meta:
        verbose_name = 'รีวิว'
        verbose_name_plural = 'รีวิว'
        ordering = ['-created_at']
        unique_together = ['product', 'user']  # 1 user รีวิวได้ 1 ครั้งต่อสินค้า
    
    def __str__(self):
        return f"Review by {self.user.email} - {self.product.name}"