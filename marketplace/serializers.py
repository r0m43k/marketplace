from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import CartItem, Category, Order, OrderItem, Product, Review


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon"]


class ProductSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    category_detail = CategorySerializer(source="category", read_only=True)
    avg_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "seller",
            "category",
            "category_detail",
            "title",
            "description",
            "price",
            "stock",
            "image_url",
            "is_active",
            "avg_rating",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["is_active", "created_at", "updated_at"]


class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source="product", read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_detail", "quantity", "subtotal", "added_at"]
        read_only_fields = ["added_at"]

    def validate(self, attrs):
        product = attrs.get("product") or getattr(self.instance, "product", None)
        quantity = attrs.get("quantity") or getattr(self.instance, "quantity", 1)

        if product and not product.is_active:
            raise serializers.ValidationError("Product is not active.")
        if product and quantity > product.stock:
            raise serializers.ValidationError("Requested quantity is greater than stock.")
        return attrs


class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_title", "quantity", "price_at_purchase", "subtotal"]


class OrderSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ["id", "buyer", "status", "total", "items", "created_at"]
        read_only_fields = ["status", "total", "created_at"]


class ReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "product", "author", "rating", "text", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]
