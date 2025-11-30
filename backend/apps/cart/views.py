# “””

# Cart App - Views

“””
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product

from .models import Cart, CartItem
from .serializers import (
AddToCartSerializer,
CartSerializer,
SyncCartSerializer,
UpdateCartItemSerializer,
)

class CartView(APIView):
“””
GET /api/cart/ - ดูตะกร้าสินค้า
DELETE /api/cart/ - ล้างตะกร้า
“””
permission_classes = [permissions.IsAuthenticated]

```
def get(self, request):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart, context={'request': request})
    return Response(serializer.data)

def delete(self, request):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    cart.items.all().delete()
    return Response({'message': 'ล้างตะกร้าสำเร็จ'})
```

class ClearCartView(APIView):
“””
DELETE /api/cart/clear/ - ล้างตะกร้าสินค้า
POST /api/cart/clear/ - ล้างตะกร้าสินค้า (รองรับ POST ด้วย)
“””
permission_classes = [permissions.IsAuthenticated]

```
def delete(self, request):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    cart.items.all().delete()
    return Response({'message': 'ล้างตะกร้าสำเร็จ'}, status=status.HTTP_200_OK)

def post(self, request):
    return self.delete(request)
```

class SyncCartView(APIView):
“””
POST /api/cart/sync/ - Sync ตะกร้าจาก localStorage
“””
permission_classes = [permissions.IsAuthenticated]

```
def post(self, request):
    serializer = SyncCartSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    cart, _ = Cart.objects.get_or_create(user=request.user)
    
    # ลบของเก่าแล้วเพิ่มใหม่
    cart.items.all().delete()
    
    for item_data in serializer.validated_data['items']:
        CartItem.objects.create(
            cart=cart,
            product=item_data['product'],
            quantity=item_data['quantity']
        )
    
    return Response({
        'message': 'Sync ตะกร้าสำเร็จ',
        'cart': CartSerializer(cart, context={'request': request}).data
    })
```

class AddToCartView(APIView):
“””
POST /api/cart/add/ - เพิ่มสินค้าในตะกร้า
“””
permission_classes = [permissions.IsAuthenticated]

```
def post(self, request):
    serializer = AddToCartSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    cart, _ = Cart.objects.get_or_create(user=request.user)
    product = Product.objects.get(id=serializer.validated_data['product_id'])
    quantity = serializer.validated_data['quantity']
    
    # ตรวจสอบว่ามีในตะกร้าแล้วหรือไม่
    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={'quantity': quantity}
    )
    
    if not created:
        # ถ้ามีอยู่แล้ว ให้เพิ่มจำนวน
        new_quantity = cart_item.quantity + quantity
        if new_quantity > product.stock:
            return Response({
                'error': f'สินค้ามีไม่พอ (เหลือ {product.stock} ชิ้น)'
            }, status=status.HTTP_400_BAD_REQUEST)
        cart_item.quantity = new_quantity
        cart_item.save()
    
    return Response({
        'message': 'เพิ่มสินค้าในตะกร้าสำเร็จ',
        'cart': CartSerializer(cart, context={'request': request}).data
    })
```

class CartItemView(APIView):
“””
PUT /api/cart/items/{item_id}/ - อัพเดทจำนวน
DELETE /api/cart/items/{item_id}/ - ลบออกจากตะกร้า
“””
permission_classes = [permissions.IsAuthenticated]

```
def get_cart_item(self, request, item_id):
    try:
        return CartItem.objects.get(
            id=item_id,
            cart__user=request.user
        )
    except CartItem.DoesNotExist:
        return None

def put(self, request, item_id):
    cart_item = self.get_cart_item(request, item_id)
    if not cart_item:
        return Response(
            {'error': 'ไม่พบรายการนี้ในตะกร้า'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = UpdateCartItemSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    quantity = serializer.validated_data['quantity']
    
    if quantity == 0:
        cart_item.delete()
        message = 'ลบรายการออกจากตะกร้าสำเร็จ'
    else:
        if quantity > cart_item.product.stock:
            return Response({
                'error': f'สินค้ามีไม่พอ (เหลือ {cart_item.product.stock} ชิ้น)'
            }, status=status.HTTP_400_BAD_REQUEST)
        cart_item.quantity = quantity
        cart_item.save()
        message = 'อัพเดทจำนวนสำเร็จ'
    
    cart = Cart.objects.get(user=request.user)
    return Response({
        'message': message,
        'cart': CartSerializer(cart, context={'request': request}).data
    })

def delete(self, request, item_id):
    cart_item = self.get_cart_item(request, item_id)
    if not cart_item:
        return Response(
            {'error': 'ไม่พบรายการนี้ในตะกร้า'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    cart_item.delete()
    cart = Cart.objects.get(user=request.user)
    
    return Response({
        'message': 'ลบรายการออกจากตะกร้าสำเร็จ',
        'cart': CartSerializer(cart, context={'request': request}).data
    })
```