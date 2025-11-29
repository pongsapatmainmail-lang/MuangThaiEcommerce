"""
===========================================
Users App - URLs
===========================================
"""
from django.urls import path

from .views import (
    BecomeSellerView,
    ChangePasswordView,
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('become-seller/', BecomeSellerView.as_view(), name='become-seller'),
]