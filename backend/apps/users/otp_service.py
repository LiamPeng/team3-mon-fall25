"""
OTP service for email verification
"""

import random
import string
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# OTP expiration time (10 minutes)
OTP_EXPIRATION_MINUTES = 10
OTP_LENGTH = 6


def generate_otp() -> str:
    """
    Generate a 6-digit OTP code
    """
    return "".join(random.choices(string.digits, k=OTP_LENGTH))


def send_otp_email(email: str, otp: str) -> bool:

    subject = "NYU Marketplace - Email Verification Code"
    message = f"""
    Your email verification code for NYU Marketplace is: {otp}

    This code will expire in {OTP_EXPIRATION_MINUTES} minutes.

    If you didn't request this code, please ignore this email.
    """
    default_sender = settings.EMAIL_HOST_USER or "noreply@nyu-marketplace.com"
    from_email = getattr(settings, "OTP_EMAIL_SENDER", default_sender)

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info(f"OTP email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        return False


def store_otp(email: str, otp: str) -> None:
    """
    Store OTP in cache with expiration
    """
    cache_key = f"otp_{email}"
    cache.set(cache_key, otp, timeout=OTP_EXPIRATION_MINUTES * 60)


def get_otp(email: str) -> str:
    """
    Retrieve OTP from cache
    Returns None if OTP doesn't exist or has expired
    """
    cache_key = f"otp_{email}"
    return cache.get(cache_key)


def verify_otp(email: str, provided_otp: str) -> bool:
    """
    Verify if the provided OTP matches the stored OTP for the email
    Returns True if valid, False otherwise
    """
    stored_otp = get_otp(email)
    if not stored_otp:
        logger.warning(f"No OTP found for {email} or OTP expired")
        return False

    if stored_otp != provided_otp:
        logger.warning(f"Invalid OTP provided for {email}")
        return False

    # OTP verified successfully, remove it from cache
    cache_key = f"otp_{email}"
    cache.delete(cache_key)
    logger.info(f"OTP verified successfully for {email}")
    return True


def delete_otp(email: str) -> None:
    """
    Delete OTP from cache (useful for cleanup)
    """
    cache_key = f"otp_{email}"
    cache.delete(cache_key)
