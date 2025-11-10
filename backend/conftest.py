# backend/conftest.py
import os
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings_ci")


@pytest.fixture(autouse=True)
def _media_settings(tmp_path, settings):
    # Keep uploads local and ephemeral during tests
    settings.MEDIA_ROOT = tmp_path / "media"
    return settings
