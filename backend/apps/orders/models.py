"""
===========================================
Orders App - Models
===========================================
"""
import uuid

from django.conf import settings
from django.db import models

from apps.products.models import Product


class Order(models.Model):
    """คำสั่งซื้อ"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'รอชำระเงิน'
        PAID = 'paid', 'ชำระเงินแล้ว'
        SHIPPED = 'shipped', 'จัดส่งแล้ว'
        DELIVERED = 'delivered', 'ได้รับสินค้าแล้ว'
        CANCELLED = 'cancelled', 'ยกเลิก'
    
    class PaymentMethod(models.TextChoices):
        CREDIT_CARD = 'credit_card', 'บัตรเครดิต/เดบิต'
        BANK_TRANSFER = 'bank_transfer', 'โอนเงิน'
        COD = 'cod', 'ชำระเงินปลายทาง'
    
    order_number = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='เลขที่คำสั่งซื้อ'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='ผู้ซื้อ'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='สถานะ'
    )
    
    # Shipping Info
    shipping_name = models.CharField(max_length=100, verbose_name='ชื่อผู้รับ')
    shipping_phone = models.CharField(max_length=20, verbose_name='เบอร์โทรผู้รับ')
    shipping_address = models.TextField(verbose_name='ที่อยู่จัดส่ง')
    
    # Payment Info
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
        verbose_name='วิธีชำระเงิน'
    )
    payment_status = models.BooleanField(default=False, verbose_name='ชำระเงินแล้ว')
    
    # Totals
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='ยอดรวมสินค้า')
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='ค่าจัดส่ง')
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='ยอดรวมทั้งหมด')
    
    notes = models.TextField(blank=True, null=True, verbose_name='หมายเหตุ')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='สร้างเมื่อ')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='อัพเดทเมื่อ')
    
    class Meta:
        verbose_name = 'คำสั่งซื้อ'
        verbose_name_plural = 'คำสั่งซื้อ'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.order_number}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_order_number():
        """สร้างเลขที่คำสั่งซื้อ"""
        return f"ORD{uuid.uuid4().hex[:12].upper()}"
    
    def calculate_totals(self):
        """คำนวณยอดรวม"""
        self.subtotal = sum(item.total for item in self.items.all())
        self.total = self.subtotal + self.shipping_fee
        self.save(update_fields=['subtotal', 'total'])


class OrderItem(models.Model):
    """รายการสินค้าในคำสั่งซื้อ"""
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='คำสั่งซื้อ'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        related_name='order_items',
        verbose_name='สินค้า'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sold_items',
        verbose_name='ผู้ขาย'
    )
    
    # Snapshot ข้อมูลสินค้าตอนสั่งซื้อ
    product_name = models.CharField(max_length=200, verbose_name='ชื่อสินค้า')
    product_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='ราคา')
    quantity = models.PositiveIntegerField(default=1, verbose_name='จำนวน')
    total = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='รวม')
    
    class Meta:
        verbose_name = 'รายการสินค้า'
        verbose_name_plural = 'รายการสินค้า'
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        self.total = self.product_price * self.quantity
        super().save(*args, **kwargs)