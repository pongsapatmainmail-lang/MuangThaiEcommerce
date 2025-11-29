"""
===========================================
Orders App - Admin
===========================================
"""
from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Inline สำหรับรายการสินค้าในคำสั่งซื้อ"""
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'seller', 'product_name', 'product_price', 'quantity', 'total']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin สำหรับจัดการคำสั่งซื้อ"""
    
    list_display = [
        'order_number', 'buyer', 'status', 'payment_status',
        'total', 'created_at'
    ]
    list_filter = ['status', 'payment_status', 'payment_method', 'created_at']
    search_fields = ['order_number', 'buyer__email', 'shipping_name', 'shipping_phone']
    raw_id_fields = ['buyer']
    inlines = [OrderItemInline]
    
    readonly_fields = ['order_number', 'subtotal', 'total']
    
    fieldsets = (
        ('ข้อมูลคำสั่งซื้อ', {
            'fields': ('order_number', 'buyer', 'status')
        }),
        ('ข้อมูลจัดส่ง', {
            'fields': ('shipping_name', 'shipping_phone', 'shipping_address')
        }),
        ('การชำระเงิน', {
            'fields': ('payment_method', 'payment_status')
        }),
        ('ยอดรวม', {
            'fields': ('subtotal', 'shipping_fee', 'total')
        }),
        ('หมายเหตุ', {
            'fields': ('notes',)
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Admin สำหรับรายการสินค้า"""
    
    list_display = ['order', 'product_name', 'seller', 'quantity', 'product_price', 'total']
    list_filter = ['order__status', 'seller']
    search_fields = ['order__order_number', 'product_name', 'seller__email']
    raw_id_fields = ['order', 'product', 'seller']