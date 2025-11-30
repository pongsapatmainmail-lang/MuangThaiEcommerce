"""
===========================================
Shopee Clone - Main URL Configuration
===========================================
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Endpoints - รองรับทั้ง /api/auth/ และ /api/users/
    path('api/auth/', include('apps.users.urls')),
    path('api/users/', include('apps.users.urls')),  # เพิ่มบรรทัดนี้
    path('api/products/', include('apps.products.urls')),
    path('api/cart/', include('apps.cart.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/chat/', include('chat.urls')),
    
    # JWT Token Refresh
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/token/refresh/', TokenRefreshView.as_view(), name='token_refresh_users'),  # เพิ่มบรรทัดนี้
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)