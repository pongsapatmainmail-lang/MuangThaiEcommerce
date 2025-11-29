"""
===========================================
Notifications App - Serializers
===========================================
"""
from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer สำหรับ Notification"""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'link', 'created_at'
        ]
        read_only_fields = ['notification_type', 'title', 'message', 'link', 'created_at']