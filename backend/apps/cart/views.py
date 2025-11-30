"""
Cart App - Views
"""
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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        return Response({'message': 'cleared'})


class ClearCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        return Response({'message': 'cleared'}, status=status.HTTP_200_OK)

    def post(self, request):
        return self.delete(request)


class SyncCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SyncCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()

        for item_data in serializer.validated_data['items']:
            CartItem.objects.create(
                cart=cart,
                product=item_data['product'],
                quantity=item_data['quantity']
            )

        return Response({
            'message': 'synced',
            'cart': CartSerializer(cart, context={'request': request}).data
        })


class AddToCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        product = Product.objects.get(id=serializer.validated_data['product_id'])
        quantity = serializer.validated_data['quantity']

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            new_quantity = cart_item.quantity + quantity
            if new_quantity > product.stock:
                return Response({
                    'error': 'not enough stock'
                }, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_quantity
            cart_item.save()

        return Response({
            'message': 'added',
            'cart': CartSerializer(cart, context={'request': request}).data
        })


class CartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
                {'error': 'not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data['quantity']

        if quantity == 0:
            cart_item.delete()
        else:
            if quantity > cart_item.product.stock:
                return Response({
                    'error': 'not enough stock'
                }, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = quantity
            cart_item.save()

        cart = Cart.objects.get(user=request.user)
        return Response({
            'message': 'updated',
            'cart': CartSerializer(cart, context={'request': request}).data
        })

    def delete(self, request, item_id):
        cart_item = self.get_cart_item(request, item_id)
        if not cart_item:
            return Response(
                {'error': 'not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        cart_item.delete()
        cart = Cart.objects.get(user=request.user)

        return Response({
            'message': 'deleted',
            'cart': CartSerializer(cart, context={'request': request}).data
        })