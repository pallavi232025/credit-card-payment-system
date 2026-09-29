"""
Admin panel URL configuration.
"""
from django.urls import path

from .views import (
    AdminDashboardView,
    AdminUserListView,
    AdminUserDetailView,
    AdminCardListView,
    AdminTransactionListView,
    AdminDailySummaryView,
    AdminCSVExportView,
    AdminLogListView,
)

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('cards/', AdminCardListView.as_view(), name='admin-card-list'),
    path('transactions/', AdminTransactionListView.as_view(), name='admin-transaction-list'),
    path('reports/daily-summary/', AdminDailySummaryView.as_view(), name='admin-daily-summary'),
    path('transactions/export/', AdminCSVExportView.as_view(), name='admin-csv-export'),
    path('logs/', AdminLogListView.as_view(), name='admin-log-list'),
]
