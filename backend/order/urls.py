from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from uuid import UUID

urlpatterns = [
    # Merchant Side
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API Routes
    path("<slug:business_slug>/api/menu/", views.api_menu, name="api_menu"),
    path("<slug:business_slug>/api/menu-item/<slug:slug>/", views.item, name="item"),
    path("<slug:business_slug>/api/place-order/", views.place_order, name="place_order"),
    path("<slug:business_slug>/api/orders/", views.display_orders, name="display_orders"),
    path("<slug:business_slug>/api/orders/<uuid:order_id>/", views.get_order_by_id, name="get_order_by_id"),
    path("<slug:business_slug>/api/orders/<uuid:order_id>/ready/", views.toggle_order_ready, name="toggle_order_ready"),
    path("<slug:business_slug>/api/orders/<uuid:order_id>/fulfilled/", views.toggle_order_fulfilled, name="toggle_order_fulfilled"),
]