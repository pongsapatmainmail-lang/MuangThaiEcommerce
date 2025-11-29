"""
===========================================
Products App - Tests
===========================================
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import Category, Product

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


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
def buyer_user():
    return User.objects.create_user(
        email='buyer@example.com',
        username='buyer',
        password='buyerpass123',
        role='buyer'
    )


@pytest.fixture
def category():
    return Category.objects.create(
        name='Electronics',
        slug='electronics',
        description='Electronic items'
    )


@pytest.fixture
def product(seller_user, category):
    return Product.objects.create(
        seller=seller_user,
        category=category,
        name='Test Product',
        slug='test-product',
        description='Test description',
        price=1000.00,
        stock=10
    )


@pytest.mark.django_db
class TestProductList:
    """ทดสอบการดึงรายการสินค้า"""
    
    def test_list_products(self, api_client, product):
        """ทดสอบดึงรายการสินค้าทั้งหมด"""
        url = reverse('product-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
    
    def test_filter_by_category(self, api_client, product, category):
        """ทดสอบกรองตามหมวดหมู่"""
        url = reverse('product-list')
        response = api_client.get(url, {'category': category.id})
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_search_products(self, api_client, product):
        """ทดสอบค้นหาสินค้า"""
        url = reverse('product-list')
        response = api_client.get(url, {'search': 'Test'})
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestProductCreate:
    """ทดสอบการสร้างสินค้า"""
    
    def test_create_product_as_seller(self, api_client, seller_user, category):
        """ทดสอบ seller สร้างสินค้าได้"""
        api_client.force_authenticate(user=seller_user)
        url = reverse('product-list')
        data = {
            'name': 'New Product',
            'description': 'New product description',
            'price': 500.00,
            'stock': 20,
            'category_id': category.id
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Product.objects.filter(name='New Product').exists()
    
    def test_create_product_as_buyer_fails(self, api_client, buyer_user, category):
        """ทดสอบ buyer สร้างสินค้าไม่ได้"""
        api_client.force_authenticate(user=buyer_user)
        url = reverse('product-list')
        data = {
            'name': 'New Product',
            'description': 'New product description',
            'price': 500.00,
            'stock': 20,
            'category_id': category.id
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN