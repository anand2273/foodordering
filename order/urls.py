from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("menu/", views.menu, name="menu"),
    path("menu/<slug:slug>/", views.menu_item, name="menu_item"),
    path("cart/", views.cart, name="cart"),
    # Merchant Side
    path("merchant/login/", views.login_view, name="login"),
    path("merchant/logout/", views.logout_view, name="logout"),
    path("merchant/orders/", views.orders, name="orders"),

    # API Routes
    path("api/menu/", views.api_menu, name="api_menu"),
    path("api/menu-item/<slug:slug>/", views.item, name="item"),
    path("api/place-order/", views.place_order, name="place_order"),
    path("api/orders/", views.display_orders, name="display_orders")
]