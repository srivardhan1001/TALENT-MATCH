from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
    path('top-candidates/', views.top_candidates, name='top_candidates'),
]
