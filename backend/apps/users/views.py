"""
===========================================
Users App - Views
===========================================
"""
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    BecomeSellerSerializer,
    ChangePasswordSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    ลงทะเบียนผู้ใช้ใหม่
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # สร้าง JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'ลงทะเบียนสำเร็จ',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    เข้าสู่ระบบ
    """
    serializer_class = LoginSerializer


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    ออกจากระบบ (blacklist refresh token)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'ออกจากระบบสำเร็จ'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'message': 'ออกจากระบบสำเร็จ'}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/profile/ - ดูโปรไฟล์
    PUT/PATCH /api/auth/profile/ - อัพเดทโปรไฟล์
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProfileUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    เปลี่ยนรหัสผ่าน
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response({'message': 'เปลี่ยนรหัสผ่านสำเร็จ'}, status=status.HTTP_200_OK)


class BecomeSellerView(APIView):
    """
    POST /api/auth/become-seller/
    เปลี่ยนบัญชีเป็น Seller
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = BecomeSellerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.role = User.Role.SELLER
        user.shop_name = serializer.validated_data['shop_name']
        user.shop_description = serializer.validated_data.get('shop_description', '')
        user.save()
        
        return Response({
            'message': 'เปลี่ยนเป็นผู้ขายสำเร็จ',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)