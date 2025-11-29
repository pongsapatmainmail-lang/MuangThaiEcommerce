"""
===========================================
Users App - Admin
===========================================
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin สำหรับจัดการ Users"""
    
    list_display = ['email', 'username', 'role', 'is_staff', 'is_active', 'created_at']
    list_filter = ['role', 'is_staff', 'is_active', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'shop_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('ข้อมูลเพิ่มเติม', {
            'fields': ('phone', 'address', 'avatar', 'role', 'shop_name', 'shop_description')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('ข้อมูลเพิ่มเติม', {
            'fields': ('email', 'role')
        }),
    )