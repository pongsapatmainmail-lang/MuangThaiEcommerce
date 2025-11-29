"""
===========================================
Users App - Tests
===========================================
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user():
    return User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='testpass123'
    )


@pytest.mark.django_db
class TestRegister:
    """ทดสอบการลงทะเบียน"""
    
    def test_register_success(self, api_client):
        """ทดสอบลงทะเบียนสำเร็จ"""
        url = reverse('register')
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'newpass123!@#',
            'password_confirm': 'newpass123!@#',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'tokens' in response.data
        assert 'user' in response.data
        assert response.data['user']['email'] == 'newuser@example.com'
    
    def test_register_password_mismatch(self, api_client):
        """ทดสอบลงทะเบียนด้วยรหัสผ่านไม่ตรงกัน"""
        url = reverse('register')
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'newpass123!@#',
            'password_confirm': 'differentpass123!@#'
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    """ทดสอบการเข้าสู่ระบบ"""
    
    def test_login_success(self, api_client, test_user):
        """ทดสอบเข้าสู่ระบบสำเร็จ"""
        url = reverse('login')
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_login_wrong_password(self, api_client, test_user):
        """ทดสอบเข้าสู่ระบบด้วยรหัสผ่านผิด"""
        url = reverse('login')
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProfile:
    """ทดสอบการดูและแก้ไขโปรไฟล์"""
    
    def test_get_profile(self, api_client, test_user):
        """ทดสอบดูโปรไฟล์"""
        api_client.force_authenticate(user=test_user)
        url = reverse('profile')
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'test@example.com'
    
    def test_update_profile(self, api_client, test_user):
        """ทดสอบอัพเดทโปรไฟล์"""
        api_client.force_authenticate(user=test_user)
        url = reverse('profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone': '0812345678'
        }
        
        response = api_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'