from django.urls import path

from . import views

app_name = "order"

urlpatterns = [
    path("menu-items/", views.MenuListView.as_view(), name="menu-list"),
    path("menu-items/<slug:slug>/", views.MenuDetailView.as_view(), name="menu-detail"),
    path("locations/", views.LocationListView.as_view(), name="location-list"),
    path("checkouts/", views.CheckoutView.as_view(), name="checkout"),
    path("order-status/", views.CustomerOrderView.as_view(), name="order-status"),
    path("auth/csrf/", views.CsrfView.as_view(), name="csrf"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/session/", views.SessionView.as_view(), name="session"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("merchant/orders/", views.MerchantOrderListView.as_view(), name="merchant-orders"),
    path(
        "merchant/orders/<uuid:order_id>/status/",
        views.MerchantOrderStatusView.as_view(),
        name="merchant-order-status",
    ),
    path(
        "merchant/locations/<int:location_id>/fulfill-ready/",
        views.FulfillReadyOrdersView.as_view(),
        name="fulfill-ready-orders",
    ),
    path("webhooks/stripe/", views.StripeWebhookView.as_view(), name="stripe-webhook"),
    path("health/live/", views.LiveHealthView.as_view(), name="health-live"),
    path("health/ready/", views.ReadyHealthView.as_view(), name="health-ready"),
]
