from rest_framework.decorators import action
from django.shortcuts import render
from rest_framework import viewsets, mixins, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Listing
from .serializers import ListingCreateSerializer, ListingUpdateSerializer, CompactListingSerializer, ListingDetailSerializer

# Create your views here.

class ListingViewSet(
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    ):
    """
    A viewset for creating listings.
    Exposes a POST endpoint to /api/listings/.
    """
    queryset = Listing.objects.all().select_related("user").prefetch_related("images")
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return ListingCreateSerializer
        if self.action == 'update':
            return ListingUpdateSerializer
        if self.action == 'retrieve':
            return ListingDetailSerializer
        if self.action in ['partial_update', 'update']:
            return ListingUpdateSerializer
        return ListingCreateSerializer

    def perform_create(self, serializer):
        """Automatically set the user when creating a listing"""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=getattr(self.get_object(), "user", self.request.user))

    @action(
        detail=False,
        methods=["get"],
        url_path="user",
        permission_classes=[permissions.IsAuthenticated],
    )
    def user_listings(self, request):
        qs = Listing.objects.filter(user=self.request.user).prefetch_related("images").order_by("-created_at")
        serializer = CompactListingSerializer(qs, many=True)
        return Response(serializer.data)