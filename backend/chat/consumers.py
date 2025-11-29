"""
===========================================
Chat Consumers (WebSocket)
===========================================
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket Consumer สำหรับแชท Real-time"""

    async def connect(self):
        """เชื่อมต่อ WebSocket"""
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']

        # ตรวจสอบว่า user เป็นผู้เข้าร่วมในห้องแชทหรือไม่
        if not await self.is_participant():
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # ส่งสถานะ online
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_status',
                'user_id': self.user.id,
                'username': self.user.username,
                'status': 'online'
            }
        )

    async def disconnect(self, close_code):
        """ยกเลิกการเชื่อมต่อ WebSocket"""
        # ส่งสถานะ offline
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_status',
                'user_id': self.user.id,
                'username': self.user.username,
                'status': 'offline'
            }
        )

        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """รับข้อความจาก WebSocket"""
        data = json.loads(text_data)
        message_type = data.get('type', 'message')

        if message_type == 'message':
            await self.handle_message(data)
        elif message_type == 'typing':
            await self.handle_typing(data)
        elif message_type == 'read':
            await self.handle_read(data)

    async def handle_message(self, data):
        """จัดการข้อความใหม่"""
        content = data.get('content', '')
        msg_type = data.get('message_type', 'text')
        image_url = data.get('image_url')
        file_url = data.get('file_url')

        if not content and not image_url and not file_url:
            return

        # บันทึกข้อความลง database
        message = await self.save_message(content, msg_type, image_url, file_url)

        # ส่งข้อความไปยังทุกคนในห้อง
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': message.id,
                    'sender_id': self.user.id,
                    'sender_name': self.user.username,
                    'content': content,
                    'message_type': msg_type,
                    'image_url': image_url,
                    'file_url': file_url,
                    'created_at': message.created_at.isoformat(),
                    'is_read': False,
                }
            }
        )

    async def handle_typing(self, data):
        """จัดการสถานะกำลังพิมพ์"""
        is_typing = data.get('is_typing', False)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_typing',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': is_typing
            }
        )

    async def handle_read(self, data):
        """จัดการการอ่านข้อความ"""
        await self.mark_messages_read()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'messages_read',
                'user_id': self.user.id,
            }
        )

    async def chat_message(self, event):
        """ส่งข้อความไปยัง WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message']
        }))

    async def user_typing(self, event):
        """ส่งสถานะกำลังพิมพ์"""
        # ไม่ส่งให้ตัวเอง
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing']
            }))

    async def user_status(self, event):
        """ส่งสถานะ online/offline"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'status',
                'user_id': event['user_id'],
                'username': event['username'],
                'status': event['status']
            }))

    async def messages_read(self, event):
        """ส่งสถานะอ่านข้อความแล้ว"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'read',
                'user_id': event['user_id']
            }))

    @database_sync_to_async
    def is_participant(self):
        """ตรวจสอบว่า user เป็นผู้เข้าร่วมในห้องแชท"""
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            return room.participant1 == self.user or room.participant2 == self.user
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content, msg_type, image_url, file_url):
        """บันทึกข้อความลง database"""
        room = ChatRoom.objects.get(id=self.room_id)
        message = Message.objects.create(
            room=room,
            sender=self.user,
            message_type=msg_type,
            content=content,
            image_url=image_url,
            file_url=file_url,
        )
        room.save()  # อัพเดท updated_at
        return message

    @database_sync_to_async
    def mark_messages_read(self):
        """อ่านข้อความทั้งหมด"""
        room = ChatRoom.objects.get(id=self.room_id)
        room.messages.filter(
            is_read=False
        ).exclude(
            sender=self.user
        ).update(is_read=True)