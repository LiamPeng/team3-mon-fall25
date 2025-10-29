"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.views.decorators.cache import never_cache
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# SPA index.html（No CSRF）
spa_view = method_decorator(csrf_exempt, name="dispatch")(
    TemplateView.as_view(template_name="index.html")
)

def health_ok(_):
    return HttpResponse("ok", content_type="text/plain")

urlpatterns = [
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.listings.urls')),
    path('api/v1/', include('apps.users.urls')),
    path('api/v1/', include('apps.listings.urls')),
    path("admin/", admin.site.urls), 
]

# SPA fallback, excluding api/admin/static/media
urlpatterns += [
    re_path(r"^(?!api/|admin/|static/|media/).*$", spa_view),
    path("health", health_ok),
]

# DEBUG only, Django serves static files
if settings.DEBUG:
    from django.conf.urls.static import static
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)