"""
===========================================
Chat Admin
===========================================
"""
from django.contrib import admin
from .models import ChatRoom, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['sender', 'message_type', 'content', 'created_at', 'is_read']
    can_delete = False


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['id', 'room_type', 'participant1', 'participant2', 'product', 'updated_at']
    list_filter = ['room_type', 'is_active', 'created_at']
    search_fields = ['participant1__username', 'participant2__username']
    inlines = [MessageInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'room', 'sender', 'message_type', 'short_content', 'is_read', 'created_at']
    list_filter = ['message_type', 'is_read', 'created_at']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['created_at', 'read_at']

    def short_content(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    short_content.short_description = 'เนื้อหา'