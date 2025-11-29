"""
===========================================
Cart App - URLs
===========================================
"""
from django.urls import path

from .views import AddToCartView, CartItemView, CartView, SyncCartView

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('sync/', SyncCartView.as_view(), name='cart-sync'),
    path('add/', AddToCartView.as_view(), name='cart-add'),
    path('items/<int:item_id>/', CartItemView.as_view(), name='cart-item'),
]