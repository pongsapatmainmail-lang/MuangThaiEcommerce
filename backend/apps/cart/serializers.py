"""
===========================================
Cart App - Serializers
===========================================
"""
from rest_framework import serializers

from apps.products.models import Product
from apps.products.serializers import ProductListSerializer

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer สำหรับรายการในตะกร้า"""
    
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source='product',
        write_only=True
    )
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'total']


class CartSerializer(serializers.ModelSerializer):
    """Serializer สำหรับตะกร้าสินค้า"""
    
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'total_price', 'updated_at']


class SyncCartSerializer(serializers.Serializer):
    """Serializer สำหรับ sync ตะกร้าจาก localStorage"""
    
    items = serializers.ListField(
        child=serializers.DictField()
    )
    
    def validate_items(self, items):
        validated_items = []
        for item in items:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            
            if not product_id:
                continue
            
            try:
                product = Product.objects.get(id=product_id, is_active=True)
                # ปรับ quantity ให้ไม่เกิน stock
                quantity = min(quantity, product.stock)
                if quantity > 0:
                    validated_items.append({
                        'product': product,
                        'quantity': quantity
                    })
            except Product.DoesNotExist:
                continue
        
        return validated_items


class AddToCartSerializer(serializers.Serializer):
    """Serializer สำหรับเพิ่มสินค้าในตะกร้า"""
    
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    
    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError('สินค้าไม่พบหรือไม่พร้อมขาย')
        return value
    
    def validate(self, attrs):
        product = Product.objects.get(id=attrs['product_id'])
        if product.stock < attrs['quantity']:
            raise serializers.ValidationError({
                'quantity': f'สินค้ามีไม่พอ (เหลือ {product.stock} ชิ้น)'
            })
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    """Serializer สำหรับอัพเดทจำนวนสินค้าในตะกร้า"""
    
    quantity = serializers.IntegerField(min_value=0)