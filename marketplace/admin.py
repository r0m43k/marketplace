from django.contrib import admin

from .models import CartItem, Category, Order, OrderItem, Product, Review


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "icon"]
    prepopulated_fields = {"slug": ["name"]}
    search_fields = ["name", "slug"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["title", "seller", "category", "price", "stock", "is_active", "created_at"]
    list_filter = ["is_active", "category", "created_at"]
    search_fields = ["title", "description", "seller__username"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "buyer", "status", "total", "created_at"]
    list_filter = ["status", "created_at"]
    inlines = [OrderItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ["user", "product", "quantity", "added_at"]
    search_fields = ["user__username", "product__title"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["product", "author", "rating", "created_at"]
    list_filter = ["rating", "created_at"]
    search_fields = ["product__title", "author__username", "text"]
