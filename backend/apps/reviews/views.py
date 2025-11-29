"""
===========================================
Reviews App - Views
===========================================
"""
from rest_framework import generics, permissions, viewsets

from .models import Review
from .serializers import CreateReviewSerializer, ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """
    API สำหรับจัดการรีวิว
    - list: GET /api/reviews/?product={id}
    - create: POST /api/reviews/
    - retrieve: GET /api/reviews/{id}/
    - destroy: DELETE /api/reviews/{id}/
    """
    serializer_class = ReviewSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateReviewSerializer
        return ReviewSerializer
    
    def get_queryset(self):
        queryset = Review.objects.select_related('user', 'product')
        
        # Filter by product
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset
    
    def perform_destroy(self, instance):
        # ตรวจสอบว่าเป็นเจ้าของรีวิว
        if instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('คุณไม่มีสิทธิ์ลบรีวิวนี้')
        instance.delete()