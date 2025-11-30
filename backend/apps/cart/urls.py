"""
===========================================
Cart App - URLs
===========================================
"""
from django.urls import path

from .views import AddToCartView, CartItemView, CartView, SyncCartView, ClearCartView

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('sync/', SyncCartView.as_view(), name='cart-sync'),
    path('add/', AddToCartView.as_view(), name='cart-add'),
    path('clear/', ClearCartView.as_view(), name='cart-clear'),  # เพิ่มบรรทัดนี้
    path('items/<int:item_id>/', CartItemView.as_view(), name='cart-item'),
]