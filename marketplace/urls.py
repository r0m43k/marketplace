from django.urls import path
from . import views
 
urlpatterns = [
    path("", views.index, name="index"),
    path("product/<int:pk>/", views.product_detail, name="product"),
    path("sell/", views.sell, name="sell"),
 
    path("cart/", views.cart, name="cart"),
    path("cart/add/<int:product_pk>/", views.cart_add, name="cart_add"),
    path("cart/remove/<int:item_pk>/", views.cart_remove, name="cart_remove"),
 
    path("checkout/", views.checkout, name="checkout"),
    path("orders/", views.orders, name="orders"),
 
    path("review/<int:product_pk>/", views.review_add, name="review_add"),
 
    path("login/", views.login_view, name="login"),
    path("register/", views.register_view, name="register"),
    path("logout/", views.logout_view, name="logout"),
]
 
