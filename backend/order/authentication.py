from rest_framework.authentication import BaseAuthentication

class SessionOrJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # Check if this is a session-based route
        if any(route in request.path for route in ['/api/session-orders/', '/api/place-order/']):
            # Skip authentication for session routes
            return None
        
        # For all other routes, let JWT handle it
        return None
