from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserAuthSerializer,
    UserDetailSerializer,
    OTPVerificationSerializer,
)
from .otp_service import (
    generate_otp,
    send_otp_email,
    verify_otp,
    store_otp,
)
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class AuthViewSet(viewsets.GenericViewSet):
    """
    ViewSet for authentication operations.
    Follows the same pattern as ListingViewSet.
    """

    queryset = User.objects.all()
    serializer_class = UserAuthSerializer

    def get_permissions(self):
        """
        Set permissions based on action.
        """
        if self.action in ["login", "register", "verify_otp"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def register(self, request):
        """
        Register new user and send OTP email

        POST /api/v1/auth/register/
        Body: { "email": "user@nyu.edu", "password": "password123" }
        """
        serializer = UserAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            error_msg = "User with this email already exists. " "Please login instead."
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create new user with is_email_verified=False
        netid = email.split("@")[0]  # Extract netid from email
        user = User.objects.create_user(
            email=email,
            password=password,
            netid=netid,
            is_email_verified=False,
        )

        # Generate and send OTP
        otp = generate_otp()
        store_otp(email, otp)
        email_sent = send_otp_email(email, otp)

        if not email_sent:
            # If email sending fails, delete the user and return error
            user.delete()
            error_msg = "Failed to send verification email. Please try again."
            return Response(
                {"error": error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.info(f"User registered: {email}, OTP sent")

        msg = (
            "Registration successful. "
            "Please check your email for the verification code."
        )
        return Response(
            {
                "message": msg,
                "user_id": user.user_id,
                "email": email,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], permission_classes=[AllowAny], url_path="verify-otp")
    def verify_otp(self, request):
        """
        Verify OTP and activate user account

        POST /api/v1/auth/verify-otp/
        Body: { "email": "user@nyu.edu", "otp": "123456" }
        """
        serializer = OTPVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        provided_otp = serializer.validated_data["otp"]

        # Get user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found. Please register first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify OTP
        if not verify_otp(email, provided_otp):
            error_msg = "Invalid or expired OTP. Please request a new one."
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark email as verified
        user.is_email_verified = True
        user.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        logger.info(f"Email verified for user: {email}")

        return Response(
            {
                "message": "Email verified successfully",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": UserDetailSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def login(self, request):
        """
        Login endpoint
        - If user is verified: returns JWT tokens
        - If user exists but not verified: sends OTP and returns message
        - If user doesn't exist: returns error (should use register endpoint)

        POST /api/v1/auth/login/
        """
        serializer = UserAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # Check if user exists
        try:
            user = User.objects.get(email=email)
            # User exists - verify password
            if not user.check_password(password):
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Check if email is verified
            if not user.is_email_verified:
                # Send OTP for verification
                otp = generate_otp()
                store_otp(email, otp)
                email_sent = send_otp_email(email, otp)

                if not email_sent:
                    error_msg = (
                        "Failed to send verification email. " "Please try again."
                    )
                    return Response(
                        {"error": error_msg},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )

                logger.info(f"OTP sent to unverified user: {email}")

                error_msg = (
                    "Email not verified. Please verify your email "
                    "using the OTP sent to your email."
                )
                return Response(
                    {
                        "error": error_msg,
                        "requires_verification": True,
                        "email": email,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # User is verified - generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "user": UserDetailSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )

        except User.DoesNotExist:
            # User doesn't exist - redirect to register
            return Response(
                {
                    "error": "User not found. Please register first.",
                    "requires_registration": True,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current authenticated user's details

        GET /api/v1/auth/me/
        """
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
