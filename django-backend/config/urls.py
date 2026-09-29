"""
URL configuration for Credit Card Payment System.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/cards/', include('apps.cards.urls')),
    path('api/transactions/', include('apps.transactions.urls')),
    path('api/admin/', include('apps.adminpanel.urls')),
]
