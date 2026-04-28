from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Q, Avg
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json

from .models import Product, Category, CartItem, Order, OrderItem, Review

def index(request):
    query = request.GET.get("q", "")
    category_slug = request.GET.get("category", "")
    sort = request.GET.get("sort", "new")

    products = Product.objects.filter(is_active=True).select_related("seller", "category")

    if query:
        products = products.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        )
    if category_slug:
        products = products.filter(category__slug=category_slug)

    sort_map = {
        "new": "-created_at",
        "price_asc": "price",
        "price_desc": "-price",
    }
    products = products.order_by(sort_map.get(sort, "-created_at"))

    categories = Category.objects.all()
    cart_count = request.user.cart.count() if request.user.is_authenticated else 0

    return render(request, "marketplace/index.html", {
        "products": products,
        "categories": categories,
        "query": query,
        "selected_category": category_slug,
        "sort": sort,
        "cart_count": cart_count,
    })

def product_detail(request, pk):
    product = get_object_or_404(Product, pk=pk, is_active=True)
    reviews = product.reviews.select_related("author").order_by("-created_at")
    user_review = None
    in_cart = False

    if request.user.is_authenticated:
        user_review = reviews.filter(author=request.user).first()
        in_cart = CartItem.objects.filter(user=request.user, product=product).exists()

    return render(request, "marketplace/product.html", {
        "product": product,
        "reviews": reviews,
        "user_review": user_review,
        "in_cart": in_cart,
        "avg_rating": product.avg_rating(),
    })

@login_required
def cart(request):
    items = request.user.cart.select_related("product").all()
    total = sum(item.subtotal() for item in items)
    return render(request, "marketplace/cart.html", {
        "items": items,
        "total": total,
    })

@login_required
@require_POST
def cart_add(request, product_pk):
    product = get_object_or_404(Product, pk=product_pk, is_active=True)

    if product.stock <= 0:
        messages.error(request, "Out of stock")
        return redirect("product", pk=product.pk)

    item, created = CartItem.objects.get_or_create(
        user=request.user,
        product=product,
    )

    if not created:
        if item.quantity >= product.stock:
            messages.error(request, "Not enough stock")
            return redirect("product", pk=product.pk)

        item.quantity += 1
        item.save()

    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        count = sum(i.quantity for i in request.user.cart.all())
        return JsonResponse({"count": count})

    return redirect("cart")


@login_required
@require_POST
def cart_remove(request, item_pk):
    CartItem.objects.filter(pk=item_pk, user=request.user).delete()
    return redirect("cart")

@login_required
def checkout(request):
    items = request.user.cart.select_related("product").all()
    if not items:
        return redirect("cart")

    if request.method == "POST":
        for item in items:
            if item.quantity > item.product.stock:
                messages.error(request, f"Not enough stock for {item.product.title}")
                return redirect("cart")

        total = sum(i.subtotal() for i in items)
        order = Order.objects.create(buyer=request.user, total=total, status="paid")
        for item in items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price_at_purchase=item.product.price,
            )
            item.product.stock = max(0, item.product.stock - item.quantity)
            item.product.save()
        items.delete()
        messages.success(request, f"Order #{order.pk} placed successfully!")
        return redirect("orders")

    total = sum(i.subtotal() for i in items)
    return render(request, "marketplace/checkout.html", {"items": items, "total": total})

@login_required
def orders(request):
    user_orders = request.user.orders.prefetch_related("items__product").order_by("-created_at")
    return render(request, "marketplace/orders.html", {"orders": user_orders})

@login_required
def sell(request):
    categories = Category.objects.all()
    if request.method == "POST":
        Product.objects.create(
            seller=request.user,
            category=get_object_or_404(Category, pk=request.POST.get("category")),
            title=request.POST["title"],
            description=request.POST["description"],
            price=request.POST["price"],
            stock=request.POST.get("stock", 1),
            image_url=request.POST.get("image_url", ""),
        )
        messages.success(request, "Product listed!")
        return redirect("index")
    return render(request, "marketplace/sell.html", {"categories": categories})

@login_required
@require_POST
def review_add(request, product_pk):
    product = get_object_or_404(Product, pk=product_pk)
    Review.objects.update_or_create(
        product=product,
        author=request.user,
        defaults={
            "rating": int(request.POST.get("rating", 5)),
            "text": request.POST.get("text", ""),
        },
    )
    return redirect("product", pk=product_pk)

def login_view(request):
    if request.method == "POST":
        user = authenticate(
            request,
            username=request.POST["username"],
            password=request.POST["password"],
        )
        if user:
            login(request, user)
            return redirect(request.GET.get("next", "index"))
        messages.error(request, "Invalid credentials")
    return render(request, "registration/login.html")

def register_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already taken")
        else:
            user = User.objects.create_user(username=username, password=password)
            login(request, user)
            return redirect("index")
    return render(request, "registration/register.html")

def logout_view(request):
    logout(request)
    return redirect("index")