"""
===========================================
Reviews App - Serializers
===========================================
"""
from rest_framework import serializers

from apps.products.models import Product

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer สำหรับรีวิว"""
    
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'product', 'user', 'user_name', 'user_avatar',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['user']


class CreateReviewSerializer(serializers.ModelSerializer):
    """Serializer สำหรับสร้างรีวิว"""
    
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product'
    )
    
    class Meta:
        model = Review
        fields = ['product_id', 'rating', 'comment']
    
    def validate(self, attrs):
        user = self.context['request'].user
        product = attrs['product']
        
        # ตรวจสอบว่ารีวิวแล้วหรือยัง
        if Review.objects.filter(user=user, product=product).exists():
            raise serializers.ValidationError({
                'product_id': 'คุณรีวิวสินค้านี้แล้ว'
            })
        
        return attrs
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)