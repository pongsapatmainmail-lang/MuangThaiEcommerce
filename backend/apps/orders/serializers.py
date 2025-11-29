"""
===========================================
Orders App - Serializers
===========================================
"""
from django.db import transaction
from rest_framework import serializers

from apps.notifications.tasks import send_order_notification
from apps.products.models import Product

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer สำหรับรายการสินค้าในคำสั่งซื้อ"""
    
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_id', 'product', 'product_name',
            'product_price', 'quantity', 'total', 'seller'
        ]
        read_only_fields = ['product_name', 'product_price', 'total', 'seller']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.product:
            data['product'] = {
                'id': instance.product.id,
                'name': instance.product.name,
                'slug': instance.product.slug
            }
        return data


class OrderListSerializer(serializers.ModelSerializer):
    """Serializer สำหรับ list คำสั่งซื้อ"""
    
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'total',
            'payment_status', 'items_count', 'created_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Serializer สำหรับรายละเอียดคำสั่งซื้อ"""
    
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_email = serializers.CharField(source='buyer.email', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'buyer_email', 'status',
            'shipping_name', 'shipping_phone', 'shipping_address',
            'payment_method', 'payment_status',
            'subtotal', 'shipping_fee', 'total',
            'notes', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number', 'buyer', 'subtotal', 'total']


class CreateOrderSerializer(serializers.Serializer):
    """Serializer สำหรับสร้างคำสั่งซื้อ (checkout)"""
    
    shipping_name = serializers.CharField(max_length=100)
    shipping_phone = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # Cart items
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_items(self, items):
        """ตรวจสอบสินค้าในตะกร้า"""
        validated_items = []
        
        for item in items:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            
            if not product_id:
                raise serializers.ValidationError('product_id is required')
            
            try:
                product = Product.objects.get(id=product_id, is_active=True)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f'Product {product_id} not found')
            
            if product.stock < quantity:
                raise serializers.ValidationError(
                    f'สินค้า {product.name} มีไม่พอ (เหลือ {product.stock} ชิ้น)'
                )
            
            validated_items.append({
                'product': product,
                'quantity': quantity
            })
        
        return validated_items
    
    @transaction.atomic
    def create(self, validated_data):
        """สร้างคำสั่งซื้อ"""
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        
        # สร้าง Order
        order = Order.objects.create(
            buyer=user,
            shipping_name=validated_data['shipping_name'],
            shipping_phone=validated_data['shipping_phone'],
            shipping_address=validated_data['shipping_address'],
            payment_method=validated_data['payment_method'],
            notes=validated_data.get('notes', ''),
            shipping_fee=40  # ค่าส่งคงที่ 40 บาท
        )
        
        # สร้าง OrderItems และลด stock
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            
            OrderItem.objects.create(
                order=order,
                product=product,
                seller=product.seller,
                product_name=product.name,
                product_price=product.price,
                quantity=quantity
            )
            
            # ลด stock
            product.stock -= quantity
            product.save(update_fields=['stock'])
        
        # คำนวณยอดรวม
        order.calculate_totals()
        
        # ส่ง notification (Celery task)
        send_order_notification.delay(order.id)
        
        return order


class UpdateOrderStatusSerializer(serializers.Serializer):
    """Serializer สำหรับอัพเดทสถานะคำสั่งซื้อ"""
    
    status = serializers.ChoiceField(choices=Order.Status.choices)


class MockPaymentSerializer(serializers.Serializer):
    """Serializer สำหรับ mock payment"""
    
    order_id = serializers.IntegerField()
    success = serializers.BooleanField(default=True)
    
    def validate_order_id(self, value):
        try:
            order = Order.objects.get(id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError('Order not found')
        
        if order.payment_status:
            raise serializers.ValidationError('Order already paid')
        
        return value