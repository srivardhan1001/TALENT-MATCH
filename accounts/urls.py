from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('login/recruiter/', views.RecruiterLoginView.as_view(), name='recruiter_login'),
    path('login/applicant/', views.ApplicantLoginView.as_view(), name='applicant_login'),
    path('logout/', views.logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.change_password, name='change_password'),
]
