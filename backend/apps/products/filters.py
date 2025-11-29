"""
===========================================
Products App - Filters
===========================================
"""
import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    """Filter สำหรับค้นหาและกรองสินค้า"""
    
    # ค้นหาด้วยชื่อ
    name = django_filters.CharFilter(lookup_expr='icontains')
    
    # กรองตามราคา
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    
    # กรองตามหมวดหมู่
    category = django_filters.NumberFilter(field_name='category__id')
    category_slug = django_filters.CharFilter(field_name='category__slug')
    
    # กรองตาม seller
    seller = django_filters.NumberFilter(field_name='seller__id')
    
    # กรองสินค้าที่มีสต็อก
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    
    class Meta:
        model = Product
        fields = ['name', 'category', 'seller', 'is_active']
    
    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset