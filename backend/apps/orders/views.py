"""
===========================================
Orders App - Views
===========================================
"""
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Order
from .serializers import (
    CreateOrderSerializer,
    MockPaymentSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    UpdateOrderStatusSerializer,
)
from .pdf_generator import generate_order_pdf


class OrderViewSet(viewsets.ModelViewSet):
    """
    API สำหรับจัดการคำสั่งซื้อ
    - list: GET /api/orders/ - ดูรายการคำสั่งซื้อ
    - retrieve: GET /api/orders/{id}/ - ดูรายละเอียด
    - create: POST /api/orders/ - สร้างคำสั่งซื้อ (checkout)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        if self.action == 'create':
            return CreateOrderSerializer
        return OrderDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.all()
        
        # Filter ตาม role
        role = self.request.query_params.get('role', 'buyer')
        
        if role == 'seller' and user.is_seller:
            # Seller: ดู orders ที่มีสินค้าของตัวเอง
            queryset = queryset.filter(items__seller=user).distinct()
        else:
            # Buyer: ดู orders ของตัวเอง
            queryset = queryset.filter(buyer=user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.prefetch_related('items')
    
    def create(self, request, *args, **kwargs):
        """สร้างคำสั่งซื้อ (Checkout)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        return Response({
            'message': 'สร้างคำสั่งซื้อสำเร็จ',
            'order': OrderDetailSerializer(order).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """อัพเดทสถานะคำสั่งซื้อ (สำหรับ Seller)"""
        order = self.get_object()
        
        # ตรวจสอบสิทธิ์: ต้องเป็น seller ที่มีสินค้าใน order
        if not request.user.is_seller:
            return Response(
                {'error': 'คุณไม่มีสิทธิ์'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not order.items.filter(seller=request.user).exists():
            return Response(
                {'error': 'คุณไม่ใช่ผู้ขายสินค้าในคำสั่งซื้อนี้'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UpdateOrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order.status = serializer.validated_data['status']
        order.save(update_fields=['status', 'updated_at'])
        
        return Response({
            'message': 'อัพเดทสถานะสำเร็จ',
            'order': OrderDetailSerializer(order).data
        })
    
    @action(detail=True, methods=['post'], url_path='mock-payment')
    def mock_payment(self, request, pk=None):
        """Mock payment สำหรับทดสอบ"""
        order = self.get_object()
        
        # ตรวจสอบสิทธิ์: ต้องเป็นผู้ซื้อ
        if order.buyer != request.user:
            return Response(
                {'error': 'คุณไม่ใช่เจ้าของคำสั่งซื้อนี้'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        success = request.data.get('success', True)
        
        if success:
            order.payment_status = True
            order.status = Order.Status.PAID
            order.save(update_fields=['payment_status', 'status', 'updated_at'])
            
            return Response({
                'message': 'ชำระเงินสำเร็จ',
                'payment_status': True,
                'order': OrderDetailSerializer(order).data
            })
        else:
            return Response({
                'message': 'ชำระเงินไม่สำเร็จ',
                'payment_status': False,
                'order': OrderDetailSerializer(order).data
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='download-pdf')
    def download_pdf(self, request, pk=None):
        """ดาวน์โหลดคำสั่งซื้อเป็น PDF"""
        try:
            order = self.get_object()
            
            # ตรวจสอบสิทธิ์ (ต้องเป็นผู้ซื้อ หรือ seller ของสินค้า หรือ admin)
            user = request.user
            is_buyer = order.buyer == user
            is_seller = order.items.filter(seller=user).exists()
            is_admin = user.is_staff
            
            if not (is_buyer or is_seller or is_admin):
                return Response(
                    {'error': 'คุณไม่มีสิทธิ์ดาวน์โหลดคำสั่งซื้อนี้'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # สร้าง PDF
            pdf_buffer = generate_order_pdf(order)
            
            # ส่ง Response
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="order_{order.id}.pdf"'
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'ไม่สามารถสร้าง PDF ได้: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], url_path='view-pdf')
    def view_pdf(self, request, pk=None):
        """ดู PDF ใน browser (ไม่ดาวน์โหลด)"""
        try:
            order = self.get_object()
            
            # ตรวจสอบสิทธิ์
            user = request.user
            is_buyer = order.buyer == user
            is_seller = order.items.filter(seller=user).exists()
            is_admin = user.is_staff
            
            if not (is_buyer or is_seller or is_admin):
                return Response(
                    {'error': 'คุณไม่มีสิทธิ์ดูคำสั่งซื้อนี้'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # สร้าง PDF
            pdf_buffer = generate_order_pdf(order)
            
            # ส่ง Response (inline = ดูใน browser)
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="order_{order.id}.pdf"'
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'ไม่สามารถสร้าง PDF ได้: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )