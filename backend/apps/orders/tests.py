"""
===========================================
Orders App - Tests
===========================================
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.products.models import Category, Product

from .models import Order

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def buyer_user():
    return User.objects.create_user(
        email='buyer@example.com',
        username='buyer',
        password='buyerpass123',
        role='buyer'
    )


@pytest.fixture
def seller_user():
    return User.objects.create_user(
        email='seller@example.com',
        username='seller',
        password='sellerpass123',
        role='seller',
        shop_name='Test Shop'
    )


@pytest.fixture
def category():
    return Category.objects.create(name='Test', slug='test')


@pytest.fixture
def product(seller_user, category):
    return Product.objects.create(
        seller=seller_user,
        category=category,
        name='Test Product',
        slug='test-product',
        description='Test',
        price=100,
        stock=10
    )


@pytest.mark.django_db
class TestCreateOrder:
    """ทดสอบการสร้างคำสั่งซื้อ"""
    
    def test_create_order_success(self, api_client, buyer_user, product):
        """ทดสอบสร้างคำสั่งซื้อสำเร็จ"""
        api_client.force_authenticate(user=buyer_user)
        url = reverse('order-list')
        data = {
            'shipping_name': 'Test User',
            'shipping_phone': '0812345678',
            'shipping_address': '123 Test Street',
            'payment_method': 'cod',
            'items': [
                {'product_id': product.id, 'quantity': 2}
            ]
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Order.objects.count() == 1
        
        # ตรวจสอบว่า stock ลดลง
        product.refresh_from_db()
        assert product.stock == 8