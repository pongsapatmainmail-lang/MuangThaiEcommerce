"""
===========================================
Products Serializers (with Firebase Support)
===========================================
"""
from rest_framework import serializers
from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'is_main', 'order']


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer สำหรับแสดงรายการสินค้า"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    seller_name = serializers.CharField(source='seller.shop_name', read_only=True)
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'stock',
            'category_name', 'seller_name', 'main_image',
            'average_rating', 'review_count', 'is_active'
        ]

    def get_main_image(self, obj):
        main_img = obj.images.filter(is_main=True).first()
        if main_img:
            return main_img.image_url or (main_img.image.url if main_img.image else None)
        first_img = obj.images.first()
        if first_img:
            return first_img.image_url or (first_img.image.url if first_img.image else None)
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer สำหรับแสดงรายละเอียดสินค้า"""
    category = CategorySerializer(read_only=True)
    seller = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'stock',
            'category', 'seller', 'images',
            'average_rating', 'review_count', 'views_count',
            'is_active', 'created_at', 'updated_at'
        ]

    def get_seller(self, obj):
        return {
            'id': obj.seller.id,
            'username': obj.seller.username,
            'shop_name': obj.seller.shop_name,
        }


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer สำหรับสร้างสินค้า (รองรับ Firebase URLs)"""
    category_id = serializers.IntegerField(write_only=True)
    image_urls = serializers.ListField(
        child=serializers.URLField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'stock',
            'category_id', 'image_urls', 'images', 'is_active'
        ]
        read_only_fields = ['id', 'slug']

    def validate_category_id(self, value):
        if not Category.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("หมวดหมู่ไม่ถูกต้อง")
        return value

    def create(self, validated_data):
        image_urls = validated_data.pop('image_urls', [])
        images = validated_data.pop('images', [])
        category_id = validated_data.pop('category_id')

        # สร้างสินค้า
        product = Product.objects.create(
            category_id=category_id,
            seller=self.context['request'].user,
            **validated_data
        )

        # สร้าง ProductImage จาก Firebase URLs
        for i, url in enumerate(image_urls):
            ProductImage.objects.create(
                product=product,
                image_url=url,
                is_main=(i == 0),
                order=i
            )

        # สร้าง ProductImage จากไฟล์ที่อัพโหลด (ถ้ามี)
        for i, image in enumerate(images):
            ProductImage.objects.create(
                product=product,
                image=image,
                is_main=(i == 0 and len(image_urls) == 0),
                order=len(image_urls) + i
            )

        return product


class ProductUpdateSerializer(serializers.ModelSerializer):
    """Serializer สำหรับแก้ไขสินค้า"""
    category_id = serializers.IntegerField(required=False)
    image_urls = serializers.ListField(
        child=serializers.URLField(),
        write_only=True,
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Product
        fields = [
            'name', 'description', 'price', 'stock',
            'category_id', 'image_urls', 'is_active'
        ]

    def update(self, instance, validated_data):
        image_urls = validated_data.pop('image_urls', None)
        category_id = validated_data.pop('category_id', None)

        # อัพเดทข้อมูลสินค้า
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if category_id:
            instance.category_id = category_id

        instance.save()

        # เพิ่มรูปใหม่ (ถ้ามี)
        if image_urls:
            existing_count = instance.images.count()
            for i, url in enumerate(image_urls):
                ProductImage.objects.create(
                    product=instance,
                    image_url=url,
                    is_main=(existing_count == 0 and i == 0),
                    order=existing_count + i
                )

        return instance