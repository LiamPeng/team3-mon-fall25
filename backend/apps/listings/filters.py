from datetime import timedelta
from decimal import Decimal, InvalidOperation

import django_filters
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Listing


class ListingFilter(django_filters.FilterSet):

    # Custom filters for Listing model using django-filter
    # method-based filters
    min_price = django_filters.NumberFilter(method="filter_min_price")
    max_price = django_filters.NumberFilter(method="filter_max_price")
    location = django_filters.CharFilter(field_name="location", lookup_expr="icontains")
    category = django_filters.CharFilter(field_name="category", lookup_expr="iexact")
    posted_within = django_filters.NumberFilter(method="filter_posted_within")

    # Multiple selection filters (comma-separated OR logic)
    categories = django_filters.CharFilter(method="filter_categories")
    locations = django_filters.CharFilter(method="filter_locations")

    class Meta:
        model = Listing
        fields = [
            "min_price",
            "max_price",
            "location",
            "category",
            "posted_within",
            "categories",
            "locations",
        ]

    def filter_min_price(self, queryset, name, value):
        if value is None:
            return queryset
        # Validate non-negative
        try:
            amount = Decimal(str(value))
        except (InvalidOperation, TypeError):
            raise ValidationError({"min_price": ["Must be a valid number."]})
        if amount < 0:
            raise ValidationError({"min_price": ["Must be non-negative."]})
        return queryset.filter(price__gte=amount)

    def filter_max_price(self, queryset, name, value):
        if value is None:
            return queryset
        # Validate non-negative
        try:
            amount = Decimal(str(value))
        except (InvalidOperation, TypeError):
            raise ValidationError({"max_price": ["Must be a valid number."]})
        if amount < 0:
            raise ValidationError({"max_price": ["Must be non-negative."]})

        # Cross-field validation: min_price <= max_price
        min_raw = self.data.get("min_price") if hasattr(self, "data") else None
        if min_raw not in (None, ""):
            try:
                min_amount = Decimal(str(min_raw))
                if min_amount > amount:
                    raise ValidationError(
                        {"price": ["min_price cannot be greater than max_price."]}
                    )
            except (InvalidOperation, TypeError):
                # If min_price itself is invalid, let its own validator
                # handle on its call path
                pass

        return queryset.filter(price__lte=amount)

    def filter_posted_within(self, queryset, name, value):
        """
        Custom filter method for filtering listings created within X days.
        """
        try:
            days = int(value)
        except (TypeError, ValueError):
            raise ValidationError({"posted_within": ["Must be one of 1, 7, 30."]})

        if days not in {1, 7, 30}:
            raise ValidationError({"posted_within": ["Must be one of 1, 7, 30."]})

        since = timezone.now() - timedelta(days=days)
        return queryset.filter(created_at__gte=since)

    def filter_categories(self, queryset, name, value):
        """
        Filter by multiple categories (OR logic).
        Accepts comma-separated string: categories=Electronics,Books
        Also supports multiple query params: categories=Electronics&categories=Books
        """
        if not value:
            return queryset

        # Parse comma-separated values
        category_list = [cat.strip() for cat in value.split(",") if cat.strip()]

        # Also check for multiple query params (Django's getlist)
        # Only works if self.data is a QueryDict (from request), not a dict (from tests)
        if hasattr(self, "data") and hasattr(self.data, "getlist"):
            multi_cats = self.data.getlist("categories")
            if multi_cats and len(multi_cats) > 1:
                # If multiple params, use them instead
                category_list = [cat.strip() for cat in multi_cats if cat.strip()]

        if not category_list:
            return queryset

        # Build OR query with Q objects
        q_objects = Q()
        for cat in category_list:
            q_objects |= Q(category__iexact=cat)

        return queryset.filter(q_objects)

    def filter_locations(self, queryset, name, value):
        """
        Filter by multiple locations (OR logic).
        Supports partial matching (icontains) for flexibility.
        Accepts comma-separated string: locations=Othmer Hall,Clark Hall
        Also supports multiple query params: locations=Othmer&locations=Clark
        """
        if not value:
            return queryset

        # Parse comma-separated values
        location_list = [loc.strip() for loc in value.split(",") if loc.strip()]

        # Also check for multiple query params
        # Only works if self.data is a QueryDict (from request), not a dict (from tests)
        if hasattr(self, "data") and hasattr(self.data, "getlist"):
            multi_locs = self.data.getlist("locations")
            if multi_locs and len(multi_locs) > 1:
                # If multiple params, use them instead
                location_list = [loc.strip() for loc in multi_locs if loc.strip()]

        if not location_list:
            return queryset

        # Build OR query with Q objects (partial matching)
        q_objects = Q()
        for loc in location_list:
            q_objects |= Q(location__icontains=loc)

        return queryset.filter(q_objects)
