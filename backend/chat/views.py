"""
===========================================
Chat Views
===========================================
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message
from .serializers import (
    ChatRoomSerializer,
    MessageSerializer,
    CreateChatRoomSerializer,
    SendMessageSerializer,
)

User = get_user_model()


class ChatRoomViewSet(viewsets.ModelViewSet):
    """API สำหรับจัดการห้องแชท"""
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ดึงเฉพาะห้องแชทที่ user เป็นผู้เข้าร่วม"""
        user = self.request.user
        return ChatRoom.objects.filter(
            Q(participant1=user) | Q(participant2=user),
            is_active=True
        ).select_related('participant1', 'participant2', 'product')

    @action(detail=False, methods=['post'])
    def create_or_get(self, request):
        """สร้างหรือดึงห้องแชทที่มีอยู่แล้ว"""
        serializer = CreateChatRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        participant_id = serializer.validated_data['participant_id']
        product_id = serializer.validated_data.get('product_id')
        room_type = serializer.validated_data.get('room_type', 'buyer_seller')
        
        try:
            other_user = User.objects.get(id=participant_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'ไม่พบผู้ใช้'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # ค้นหาห้องแชทที่มีอยู่แล้ว
        room = ChatRoom.objects.filter(
            Q(participant1=request.user, participant2=other_user) |
            Q(participant1=other_user, participant2=request.user),
            product_id=product_id
        ).first()
        
        # ถ้าไม่มีให้สร้างใหม่
        if not room:
            room = ChatRoom.objects.create(
                room_type=room_type,
                participant1=request.user,
                participant2=other_user,
                product_id=product_id
            )
        
        return Response(
            ChatRoomSerializer(room, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """ดึงข้อความในห้องแชท"""
        room = self.get_object()
        messages = room.messages.all().order_by('created_at')
        
        # Mark messages as read
        messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        
        serializer = MessageSerializer(
            messages,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """ส่งข้อความในห้องแชท"""
        room = self.get_object()
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = Message.objects.create(
            room=room,
            sender=request.user,
            message_type=serializer.validated_data.get('message_type', 'text'),
            content=serializer.validated_data['content'],
            image_url=serializer.validated_data.get('image_url'),
            file_url=serializer.validated_data.get('file_url'),
        )
        
        # อัพเดท updated_at ของห้องแชท
        room.save()
        
        return Response(
            MessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """อ่านข้อความทั้งหมดในห้อง"""
        room = self.get_object()
        room.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).update(is_read=True)
        
        return Response({'status': 'success'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """นับจำนวนข้อความที่ยังไม่ได้อ่าน"""
        user = request.user
        rooms = ChatRoom.objects.filter(
            Q(participant1=user) | Q(participant2=user),
            is_active=True
        )
        
        total_unread = 0
        for room in rooms:
            total_unread += room.messages.filter(
                is_read=False
            ).exclude(sender=user).count()
        
        return Response({'unread_count': total_unread})