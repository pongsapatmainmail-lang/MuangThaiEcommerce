"""
===========================================
Orders App - Serializers
===========================================
"""
from django.db import transaction
from rest_framework import serializers

from apps.products.models import Product

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer สำหรับรายการสินค้าในคำสั่งซื้อ"""
    
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    product_name = serializers.CharField(read_only=True)
    product_image = serializers.SerializerMethodField()
    price = serializers.DecimalField(source='product_price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_id', 'product', 'product_name', 'product_image',
            'product_price', 'price', 'quantity', 'total', 'seller'
        ]
        read_only_fields = ['product_name', 'product_price', 'total', 'seller']
    
    def get_product_image(self, obj):
        if obj.product and obj.product.images.exists():
            return obj.product.images.first().image_url
        return None
    
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
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.first_name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'total', 'total_amount',
            'payment_status', 'items_count', 'items', 'buyer_name',
            'shipping_name', 'shipping_phone', 'shipping_address',
            'created_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Serializer สำหรับรายละเอียดคำสั่งซื้อ"""
    
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_email = serializers.CharField(source='buyer.email', read_only=True)
    buyer_name = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(source='total', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'buyer_email', 'buyer_name', 'status',
            'shipping_name', 'shipping_phone', 'shipping_address',
            'payment_method', 'payment_status',
            'subtotal', 'shipping_fee', 'total', 'total_amount',
            'notes', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number', 'buyer', 'subtotal', 'total']
    
    def get_buyer_name(self, obj):
        if obj.buyer:
            return f"{obj.buyer.first_name} {obj.buyer.last_name}".strip() or obj.buyer.username
        return ""


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
            # รองรับหลาย format
            product_id = item.get('product_id') or item.get('product', {}).get('id')
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
        
        # ส่ง notification แบบ sync (ไม่ใช้ Celery)
        try:
            from apps.notifications.models import Notification
            Notification.objects.create(
                user=user,
                type='order',
                title='สั่งซื้อสำเร็จ',
                message=f'คำสั่งซื้อ {order.order_number} ถูกสร้างเรียบร้อยแล้ว',
                data={'order_id': order.id}
            )
        except Exception as e:
            # ถ้าสร้าง notification ไม่ได้ก็ไม่เป็นไร
            print(f"Failed to create notification: {e}")
        
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