from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("menu/", views.menu, name="menu"),
    path("menu/<slug:slug>/", views.menu_item, name="menu_item"),
    path("cart/", views.cart, name="cart"),
    # API Routes
    path("api/menu/", views.api_menu, name="api_menu"),
    path("api/menu-item/<slug:slug>/", views.item, name="item")
]