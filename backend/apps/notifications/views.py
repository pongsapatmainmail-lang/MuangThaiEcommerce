"""
===========================================
Notifications App - Views
===========================================
"""
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(ModelViewSet):
    """
    API สำหรับจัดการ Notifications
    - list: GET /api/notifications/
    - retrieve: GET /api/notifications/{id}/
    - mark_read: POST /api/notifications/{id}/mark-read/
    - mark_all_read: POST /api/notifications/mark-all-read/
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """ทำเครื่องหมายว่าอ่านแล้ว"""
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        
        return Response({'message': 'ทำเครื่องหมายว่าอ่านแล้ว'})
    
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว"""
        self.get_queryset().filter(is_read=False).update(is_read=True)
        
        return Response({'message': 'ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว'})
    
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """นับจำนวน notifications ที่ยังไม่ได้อ่าน"""
        count = self.get_queryset().filter(is_read=False).count()
        
        return Response({'unread_count': count})