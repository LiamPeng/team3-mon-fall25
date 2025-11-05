from rest_framework.routers import DefaultRouter
from apps.users.views import AuthViewSet

router = DefaultRouter()
router.register("auth", AuthViewSet, basename="auth")
urlpatterns = router.urls

"""
    Following APIs are Supported:

       METHOD       API Endpoints                  Function

    1. POST         /api/v1/auth/register/       Register new user
                                                    and send OTP email
    2. POST         /api/v1/auth/verify-otp/     Verify OTP and activate
                                                    user account
    3. POST         /api/v1/auth/login/           Login user
                                                    (requires email
                                                    verification)
    4. GET          /api/v1/auth/me/             Get current authenticated
                                                    user details
"""
