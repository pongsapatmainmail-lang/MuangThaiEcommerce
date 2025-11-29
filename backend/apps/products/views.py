"""
===========================================
Products App - Views
===========================================
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response

from .filters import ProductFilter
from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer,
    ProductCreateSerializer,
    ProductUpdateSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
)


class IsSeller(permissions.BasePermission):
    """Permission: ต้องเป็น Seller"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_seller


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permission: ต้องเป็นเจ้าของหรืออ่านได้อย่างเดียว"""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API สำหรับจัดการหมวดหมู่
    - list: GET /api/products/categories/
    - retrieve: GET /api/products/categories/{id}/
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class ProductViewSet(viewsets.ModelViewSet):
    """
    API สำหรับจัดการสินค้า
    - list: GET /api/products/
    - retrieve: GET /api/products/{id}/
    - create: POST /api/products/
    - update: PUT /api/products/{id}/
    - destroy: DELETE /api/products/{id}/
    """
    queryset = Product.objects.filter(is_active=True).select_related('category', 'seller')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'views_count']
    ordering = ['-created_at']
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action == 'create':
            return ProductCreateSerializer
        if self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        return ProductDetailSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsSeller()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsSeller(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # ถ้าเป็น seller และดู products ของตัวเอง
        if self.request.query_params.get('my_products') and self.request.user.is_authenticated:
            queryset = Product.objects.filter(seller=self.request.user)
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # เพิ่ม view count
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-products')
    def my_products(self, request):
        """ดึงสินค้าของ seller ปัจจุบัน"""
        if not request.user.is_authenticated or not request.user.is_seller:
            return Response(
                {'error': 'คุณไม่มีสิทธิ์เข้าถึง'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = Product.objects.filter(seller=request.user)
        serializer = ProductListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class ProductImageViewSet(viewsets.ModelViewSet):
    """API สำหรับจัดการรูปภาพสินค้า"""
    
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsSeller]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_pk')
        if product_id:
            return ProductImage.objects.filter(
                product_id=product_id,
                product__seller=self.request.user
            )
        return ProductImage.objects.none()
    
    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        product = Product.objects.get(pk=product_id, seller=self.request.user)
        serializer.save(product=product)