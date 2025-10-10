from rest_framework.routers import DefaultRouter
from apps.listings.views import ListingViewSet

router = DefaultRouter()
router.register('listings', ListingViewSet, basename='listings')

urlpatterns = router.urls