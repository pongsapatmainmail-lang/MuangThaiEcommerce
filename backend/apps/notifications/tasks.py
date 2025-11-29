"""
===========================================
Notifications App - Celery Tasks
===========================================
Background tasks สำหรับส่งการแจ้งเตือนและงานอื่นๆ
"""
import logging

from celery import shared_task
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def send_order_notification(self, order_id):
    """
    Celery Task: ส่งการแจ้งเตือนเมื่อมีคำสั่งซื้อใหม่
    """
    from apps.orders.models import Order
    from .models import Notification
    
    logger.info(f"[Celery Task] Processing order notification for order_id: {order_id}")
    
    try:
        order = Order.objects.get(id=order_id)
        
        # สร้าง notification สำหรับผู้ซื้อ
        Notification.objects.create(
            user=order.buyer,
            notification_type='order',
            title='สร้างคำสั่งซื้อสำเร็จ',
            message=f'คำสั่งซื้อ #{order.order_number} ถูกสร้างเรียบร้อยแล้ว ยอดรวม {order.total} บาท',
            link=f'/orders/{order.id}'
        )
        
        # สร้าง notification สำหรับ sellers
        sellers = set(item.seller for item in order.items.all() if item.seller)
        for seller in sellers:
            Notification.objects.create(
                user=seller,
                notification_type='order',
                title='มีคำสั่งซื้อใหม่',
                message=f'คุณได้รับคำสั่งซื้อใหม่ #{order.order_number}',
                link=f'/seller/orders/{order.id}'
            )
        
        # Mock: ส่งอีเมล (จะแสดงใน console)
        logger.info(f"[Celery Task] Sending mock email to {order.buyer.email}")
        send_mail(
            subject=f'คำสั่งซื้อ #{order.order_number} ถูกสร้างแล้ว',
            message=f'ขอบคุณสำหรับการสั่งซื้อ ยอดรวม {order.total} บาท',
            from_email='noreply@shopee-clone.local',
            recipient_list=[order.buyer.email],
            fail_silently=True
        )
        
        logger.info(f"[Celery Task] Order notification completed for order_id: {order_id}")
        return f"Notification sent for order {order_id}"
        
    except Order.DoesNotExist:
        logger.error(f"[Celery Task] Order {order_id} not found")
        return f"Order {order_id} not found"
    except Exception as e:
        logger.error(f"[Celery Task] Error: {str(e)}")
        raise self.retry(exc=e, countdown=60, max_retries=3)


@shared_task
def send_payment_notification(order_id):
    """
    Celery Task: ส่งการแจ้งเตือนเมื่อชำระเงินสำเร็จ
    """
    from apps.orders.models import Order
    from .models import Notification
    
    logger.info(f"[Celery Task] Processing payment notification for order_id: {order_id}")
    
    try:
        order = Order.objects.get(id=order_id)
        
        Notification.objects.create(
            user=order.buyer,
            notification_type='payment',
            title='ชำระเงินสำเร็จ',
            message=f'คำสั่งซื้อ #{order.order_number} ชำระเงินเรียบร้อยแล้ว',
            link=f'/orders/{order.id}'
        )
        
        logger.info(f"[Celery Task] Payment notification sent for order_id: {order_id}")
        return f"Payment notification sent for order {order_id}"
        
    except Order.DoesNotExist:
        logger.error(f"[Celery Task] Order {order_id} not found")
        return f"Order {order_id} not found"


@shared_task
def create_product_thumbnail(product_image_id):
    """
    Celery Task: สร้าง thumbnail สำหรับรูปสินค้า (Mock)
    """
    from apps.products.models import ProductImage
    
    logger.info(f"[Celery Task] Creating thumbnail for image_id: {product_image_id}")
    
    try:
        image = ProductImage.objects.get(id=product_image_id)
        
        # Mock: ในการใช้งานจริงจะใช้ Pillow สร้าง thumbnail
        logger.info(f"[Celery Task] Thumbnail created for: {image.image.name}")
        
        return f"Thumbnail created for image {product_image_id}"
        
    except ProductImage.DoesNotExist:
        logger.error(f"[Celery Task] Image {product_image_id} not found")
        return f"Image {product_image_id} not found"


@shared_task
def cleanup_old_notifications():
    """
    Celery Task: ลบ notifications เก่า (30 วัน)
    """
    from datetime import timedelta
    from django.utils import timezone
    from .models import Notification
    
    logger.info("[Celery Task] Cleaning up old notifications")
    
    cutoff_date = timezone.now() - timedelta(days=30)
    deleted_count, _ = Notification.objects.filter(
        created_at__lt=cutoff_date,
        is_read=True
    ).delete()
    
    logger.info(f"[Celery Task] Deleted {deleted_count} old notifications")
    return f"Deleted {deleted_count} old notifications"