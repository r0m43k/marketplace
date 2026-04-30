from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Q

from .models import CartItem, Category, Order, OrderItem, Product, Review
from .serializers import (
    CartItemSerializer,
    CategorySerializer,
    OrderSerializer,
    ProductSerializer,
    RegisterSerializer,
    ReviewSerializer,
    UserSerializer,
)


class IsSellerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user


class StaffWriteOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_staff


class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"user": UserSerializer(user).data, "token": token.key},
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [StaffWriteOrReadOnly]
    lookup_field = "slug"


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsSellerOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.select_related("seller", "category").filter(is_active=True)
        query = self.request.query_params.get("q")
        category = self.request.query_params.get("category")
        seller = self.request.query_params.get("seller")
        sort = self.request.query_params.get("sort", "-created_at")

        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(description__icontains=query))
        if category:
            queryset = queryset.filter(category__slug=category)
        if seller:
            queryset = queryset.filter(seller__username=seller)

        allowed_sort = {"created_at", "-created_at", "price", "-price", "title", "-title"}
        if sort in allowed_sort:
            queryset = queryset.order_by(sort)
        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.cart_items.select_related("product", "product__seller", "product__category")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]
        quantity = serializer.validated_data.get("quantity", 1)

        item, created = CartItem.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            if item.quantity > product.stock:
                return Response(
                    {"detail": "Requested quantity is greater than stock."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.save(update_fields=["quantity"])

        return Response(self.get_serializer(item).data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.orders.prefetch_related("items__product")

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        with transaction.atomic():
            items = list(
                request.user.cart_items.select_related("product").select_for_update()
            )
            if not items:
                return Response({"detail": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

            product_ids = [item.product_id for item in items]
            products = Product.objects.select_for_update().in_bulk(product_ids)

            for item in items:
                product = products[item.product_id]
                if not product.is_active:
                    return Response({"detail": f"{product.title} is not active."}, status=status.HTTP_400_BAD_REQUEST)
                if item.quantity > product.stock:
                    return Response({"detail": f"Not enough stock for {product.title}."}, status=status.HTTP_400_BAD_REQUEST)

            total = sum(item.quantity * products[item.product_id].price for item in items)
            order = Order.objects.create(buyer=request.user, total=total)

            for item in items:
                product = products[item.product_id]
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item.quantity,
                    price_at_purchase=product.price,
                )
                product.stock -= item.quantity
                product.save(update_fields=["stock"])

            request.user.cart_items.all().delete()

        return Response(OrderSerializer(order, context={"request": request}).data, status=status.HTTP_201_CREATED)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_queryset(self):
        queryset = Review.objects.select_related("author", "product")
        product_id = self.request.query_params.get("product")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review, _ = Review.objects.update_or_create(
            product=serializer.validated_data["product"],
            author=request.user,
            defaults={
                "rating": serializer.validated_data["rating"],
                "text": serializer.validated_data.get("text", ""),
            },
        )
        return Response(self.get_serializer(review).data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        serializer.save(author=self.request.user)
