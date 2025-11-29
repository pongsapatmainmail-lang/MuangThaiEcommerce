"""
===========================================
Users App - Serializers
===========================================
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer สำหรับแสดงข้อมูล User"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone', 'address', 'avatar', 'role', 'shop_name',
            'shop_description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer สำหรับลงทะเบียน"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'role'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'รหัสผ่านไม่ตรงกัน'
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(TokenObtainPairSerializer):
    """Serializer สำหรับ Login พร้อม User data"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # เพิ่มข้อมูล user ใน response
        data['user'] = UserSerializer(self.user).data
        
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer สำหรับอัพเดทโปรไฟล์"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'address',
            'avatar', 'shop_name', 'shop_description'
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer สำหรับเปลี่ยนรหัสผ่าน"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('รหัสผ่านเดิมไม่ถูกต้อง')
        return value


class BecomeSellerSerializer(serializers.Serializer):
    """Serializer สำหรับเปลี่ยนเป็น Seller"""
    
    shop_name = serializers.CharField(required=True, max_length=100)
    shop_description = serializers.CharField(required=False, allow_blank=True)