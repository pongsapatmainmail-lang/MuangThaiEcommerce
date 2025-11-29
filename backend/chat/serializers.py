"""
===========================================
Chat Serializers
===========================================
"""
from rest_framework import serializers
from .models import ChatRoom, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'room', 'sender', 'sender_name', 'sender_avatar',
            'message_type', 'content', 'image_url', 'file_url',
            'is_read', 'read_at', 'created_at', 'is_mine'
        ]
        read_only_fields = ['id', 'sender', 'created_at']

    def get_sender_avatar(self, obj):
        return None  # สามารถเพิ่ม avatar URL ได้ภายหลัง

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False


class ChatRoomSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'room_type', 'participant1', 'participant2',
            'other_participant', 'product', 'product_name', 'product_image',
            'last_message', 'unread_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other = obj.get_other_participant(request.user)
            return {
                'id': other.id,
                'username': other.username,
                'shop_name': getattr(other, 'shop_name', None),
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

    def get_product_image(self, obj):
        if obj.product:
            return obj.product.main_image
        return None


class CreateChatRoomSerializer(serializers.Serializer):
    """Serializer สำหรับสร้างห้องแชทใหม่"""
    participant_id = serializers.IntegerField()
    product_id = serializers.IntegerField(required=False, allow_null=True)
    room_type = serializers.ChoiceField(choices=ChatRoom.ROOM_TYPES, default='buyer_seller')


class SendMessageSerializer(serializers.Serializer):
    """Serializer สำหรับส่งข้อความ"""
    content = serializers.CharField(max_length=5000)
    message_type = serializers.ChoiceField(
        choices=Message.MESSAGE_TYPES,
        default='text'
    )
    image_url = serializers.URLField(required=False, allow_null=True)
    file_url = serializers.URLField(required=False, allow_null=True)