"""
===========================================
Notifications App - Models
===========================================
"""
from django.conf import settings
from django.db import models


class Notification(models.Model):
    """การแจ้งเตือนในแอป"""
    
    class NotificationType(models.TextChoices):
        ORDER = 'order', 'คำสั่งซื้อ'
        PAYMENT = 'payment', 'การชำระเงิน'
        SHIPPING = 'shipping', 'การจัดส่ง'
        REVIEW = 'review', 'รีวิว'
        SYSTEM = 'system', 'ระบบ'
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='ผู้รับ'
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
        verbose_name='ประเภท'
    )
    title = models.CharField(max_length=200, verbose_name='หัวข้อ')
    message = models.TextField(verbose_name='ข้อความ')
    is_read = models.BooleanField(default=False, verbose_name='อ่านแล้ว')
    link = models.CharField(max_length=500, blank=True, null=True, verbose_name='ลิงก์')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='สร้างเมื่อ')
    
    class Meta:
        verbose_name = 'การแจ้งเตือน'
        verbose_name_plural = 'การแจ้งเตือน'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"