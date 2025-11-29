"""
===========================================
Products App - Admin
===========================================
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    """Inline สำหรับรูปภาพในหน้า Product"""
    model = ProductImage
    extra = 1
    fields = ['image', 'is_main', 'order', 'image_preview']
    readonly_fields = ['image_preview']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover;" />',
                obj.image.url
            )
        return '-'
    image_preview.short_description = 'ตัวอย่าง'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin สำหรับจัดการหมวดหมู่"""
    
    list_display = ['name', 'slug', 'is_active', 'product_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    
    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'จำนวนสินค้า'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin สำหรับจัดการสินค้า"""
    
    list_display = ['name', 'seller', 'category', 'price', 'stock', 'is_active', 'views_count', 'created_at']
    list_filter = ['is_active', 'category', 'created_at']
    search_fields = ['name', 'description', 'seller__email', 'seller__shop_name']
    prepopulated_fields = {'slug': ('name',)}
    raw_id_fields = ['seller']
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('ข้อมูลหลัก', {
            'fields': ('name', 'slug', 'description', 'seller')
        }),
        ('ราคาและสต็อก', {
            'fields': ('price', 'stock', 'category')
        }),
        ('สถานะ', {
            'fields': ('is_active', 'views_count')
        }),
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Admin สำหรับจัดการรูปภาพสินค้า"""
    
    list_display = ['id', 'product', 'is_main', 'order', 'image_preview']
    list_filter = ['is_main', 'created_at']
    raw_id_fields = ['product']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover;" />',
                obj.image.url
            )
        return '-'
    image_preview.short_description = 'ตัวอย่าง'