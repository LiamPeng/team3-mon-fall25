import pytest
from tests.factories.factories import ListingFactory, ListingImageFactory
from apps.listings.models import Listing, ListingImage
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestListingModel:
    def test_listing_creation(self):
        """
        Test that a Listing instance can be created successfully.
        """
        listing = ListingFactory()
        assert listing.pk is not None
        assert "@nyu.edu" in listing.user.email

    def test_listing_str_representation(self):
        """
        Test the __str__ method of the Listing model.
        """
        listing = ListingFactory(title="Cool Gadget")
        assert str(listing) == "Cool Gadget"

    def test_listing_default_status(self):
        """
        Test that the default status of a new listing is 'active'.
        """
        listing = ListingFactory()
        assert listing.status == "active"

    def test_price_cannot_be_negative(self):
        """
        Test that a ValidationError is raised for a negative price.
        """
        with pytest.raises(ValidationError):
            listing = ListingFactory(price=-10)
            listing.full_clean()  # This triggers the model's validation.

    def test_listing_ordering(self):
        """
        Test that listings are ordered by creation date in descending order.
        """
        listing1 = ListingFactory()
        listing2 = ListingFactory()
        listings = Listing.objects.all()
        assert list(listings) == [listing2, listing1]


@pytest.mark.django_db
class TestListingImageModel:
    def test_listing_image_creation(self):
        """
        Test that a ListingImage instance can be created successfully.
        """
        listing_image = ListingImageFactory()
        assert listing_image.pk is not None
        assert listing_image.listing is not None

    def test_listing_image_str_representation(self):
        """
        Test the __str__ method of the ListingImage model.
        """
        listing_image = ListingImageFactory(listing__title="My Listing")
        assert str(listing_image) == "Image for My Listing"

    def test_listing_image_ordering(self):
        """
        Test that listing images are ordered by their display_order.
        """
        listing = ListingFactory()
        image1 = ListingImageFactory(listing=listing, display_order=1)
        image2 = ListingImageFactory(listing=listing, display_order=0)
        images = ListingImage.objects.filter(listing=listing)
        assert list(images) == [image2, image1]
