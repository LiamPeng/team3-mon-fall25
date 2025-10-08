from rest_framework import serializers
from apps.listings.models import Listing


# Create listing — only used for POST /api/listings/
class ListingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = ['title', 'description', 'price', 'category', 'location']
    
    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be non-negative.")
        return value


# ✅ Detail page — GET /api/listings/<id>/
class ListingDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = [
            'id',
            'title',
            'description',
            'price',
            'category',
            'location',
            'created_at',
            'owner',
        ]
        read_only_fields = ['id', 'created_at', 'owner']


# ✅ Update listing— PUT / PATCH
class ListingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = ['title', 'description', 'price', 'category', 'location']
    
    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be non-negative.")
        return value


# ✅ Compact list — GET /api/listings/
class CompactListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = ['id', 'title', 'price', 'category']