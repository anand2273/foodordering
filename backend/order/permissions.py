from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class IsMerchant(BasePermission):
    message = "Merchant access is required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and (user.is_staff or user.groups.filter(name="merchant").exists())
        )
