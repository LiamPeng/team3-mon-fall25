import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_channels_jwt_user_from_valid_token(settings):
    """
    Covers your Channels JWT helper — we patch jwt.decode to avoid real secrets.
    Adjust import/func names to match your file.
    """
    with patch("core.channels_jwt.jwt") as mjwt:
        mjwt.decode.return_value = {"user_id": 42}
        from core import channels_jwt

        u = User.objects.create_user(id=42, email="t@ex.com", password="x")
        got = channels_jwt.get_user_from_token("any")
        assert got.id == u.id
        mjwt.decode.assert_called_once()


@pytest.mark.django_db
def test_channels_jwt_invalid_token_returns_none():
    with patch("core.channels_jwt.jwt") as mjwt:
        mjwt.decode.side_effect = Exception("bad")
        from core import channels_jwt

        got = channels_jwt.get_user_from_token("bad")
        assert got is None
