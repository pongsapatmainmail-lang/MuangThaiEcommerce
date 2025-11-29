"""
===========================================
Chat Models
===========================================
"""
from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    """ห้องแชท"""
    ROOM_TYPES = (
        ('buyer_seller', 'ผู้ซื้อ-ผู้ขาย'),
        ('seller_admin', 'ผู้ขาย-แอดมิน'),
    )
    
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES)
    participant1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_as_participant1'
    )
    participant2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_as_participant2'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ['participant1', 'participant2', 'product']

    def __str__(self):
        return f"Chat: {self.participant1.username} - {self.participant2.username}"

    @property
    def last_message(self):
        return self.messages.order_by('-created_at').first()

    @property
    def unread_count(self):
        return self.messages.filter(is_read=False).count()

    def get_other_participant(self, user):
        """ดึงผู้ใช้อีกคนในห้องแชท"""
        if self.participant1 == user:
            return self.participant2
        return self.participant1


class Message(models.Model):
    """ข้อความในห้องแชท"""
    MESSAGE_TYPES = (
        ('text', 'ข้อความ'),
        ('image', 'รูปภาพ'),
        ('file', 'ไฟล์'),
        ('system', 'ระบบ'),
    )
    
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField()
    image_url = models.URLField(max_length=500, blank=True, null=True)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"

    def mark_as_read(self):
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])