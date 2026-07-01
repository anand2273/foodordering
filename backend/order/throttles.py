from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class CheckoutRateThrottle(AnonRateThrottle):
    scope = "checkout"


class TrackingRateThrottle(AnonRateThrottle):
    scope = "tracking"
