# ===========================================
# Shopee Clone - Config Package
# ===========================================
# นำเข้า Celery app เพื่อให้ Django โหลดอัตโนมัติ

from .celery import app as celery_app

__all__ = ('celery_app',)