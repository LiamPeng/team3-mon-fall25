import pytest
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch

from tests.factories.factories import UserFactory, ListingFactory
from apps.listings.models import Listing


@pytest.fixture
def api_client():
    """Pytest fixture for providing an API client."""
    return APIClient()


@pytest.fixture
def authenticated_client():
    """Pytest fixture for providing an authenticated API client."""
    client = APIClient()
    user = UserFactory()
    client.force_authenticate(user=user)
    return client, user


@pytest.mark.django_db
class TestListingViewSet:
    def test_unauthenticated_user_cannot_create_listing(self, api_client):
        """
        Verify that an unauthenticated user receives a 401 Unauthorized error
        when trying to create a listing.
        """
        response = api_client.post(
            "/api/v1/listings/",
            {"title": "Test Listing", "price": 100},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_user_can_create_listing(self, authenticated_client):
        """
        Verify that an authenticated user can successfully create a listing.
        """
        client, user = authenticated_client
        with patch("utils.s3_service.s3_service.upload_image") as mock_upload:
            mock_upload.return_value = "http://example.com/mock-image.jpg"
            response = client.post(
                "/api/v1/listings/",
                {
                    "title": "New Camera",
                    "price": 750.00,
                    "category": "Electronics",
                    "description": "A great camera for beginners.",
                },
                format="json",
            )
            assert response.status_code == status.HTTP_201_CREATED
            assert Listing.objects.filter(user=user).count() == 1

    def test_list_listings_is_public(self, api_client):
        """
        Verify that the listing list endpoint is public.
        """
        ListingFactory.create_batch(3)
        response = api_client.get("/api/v1/listings/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_retrieve_listing_is_public(self, api_client):
        """
        Verify that retrieving a single listing is a public action.
        """
        listing = ListingFactory()
        response = api_client.get(f"/api/v1/listings/{listing.listing_id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == listing.title

    def test_user_can_update_own_listing(self, authenticated_client):
        """
        Verify that a user can update their own listing.
        """
        client, user = authenticated_client
        listing = ListingFactory(user=user)
        updated_title = "Updated Title"

        response = client.patch(
            f"/api/v1/listings/{listing.listing_id}/",
            {"title": updated_title},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        listing.refresh_from_db()
        assert listing.title == updated_title

    def test_user_cannot_update_other_users_listing(self, authenticated_client):
        """
        Verify that a user cannot update a listing owned by another user.
        """
        client, user = authenticated_client
        other_listing = ListingFactory()  # Belongs to a different user

        response = client.patch(
            f"/api/v1/listings/{other_listing.listing_id}/",
            {"title": "Attempted Update"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_user_can_delete_own_listing(self, authenticated_client):
        """
        Verify that a user can delete their own listing.
        """
        client, user = authenticated_client
        listing = ListingFactory(user=user)

        with patch("utils.s3_service.s3_service.delete_image") as mock_delete:
            mock_delete.return_value = True
            response = client.delete(f"/api/v1/listings/{listing.listing_id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Listing.objects.filter(listing_id=listing.listing_id).count() == 0

    def test_user_cannot_delete_other_users_listing(self, authenticated_client):
        """
        Verify that a user cannot delete a listing owned by another user.
        """
        client, user = authenticated_client
        other_listing = ListingFactory()

        response = client.delete(f"/api/v1/listings/{other_listing.listing_id}/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_user_listings(self, authenticated_client):
        """
        Verify that a user can retrieve only their own listings.
        """
        client, user = authenticated_client
        ListingFactory.create_batch(3, user=user)
        ListingFactory.create_batch(2)  # Other user's listings

        response = client.get("/api/v1/listings/user/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        assert Listing.objects.count() == 5
