"""
Card app URL configuration.
"""
from django.urls import path
from .views import CardListCreateView, CardDeleteView

urlpatterns = [
    path('', CardListCreateView.as_view(), name='card-list-create'),
    path('<int:card_id>/', CardDeleteView.as_view(), name='card-delete'),
]
