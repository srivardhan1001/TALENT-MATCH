from django.urls import path
from . import views

urlpatterns = [
    path('', views.ApplicationListCreateView.as_view(), name='application_list'),
    path('<int:pk>/', views.ApplicationDetailView.as_view(), name='application_detail'),
    path('<int:pk>/rescore/', views.rescore_application, name='application_rescore'),
    path('recruiter/jobs/<int:job_id>/', views.RecruiterJobApplicationsView.as_view(), name='recruiter_job_applications'),
    path('applicant/my-applications/', views.ApplicantApplicationsView.as_view(), name='applicant_applications'),
    path('jobs/available/', views.available_jobs, name='available_jobs'),
    path('jobs/<int:job_id>/apply/', views.apply_to_job, name='apply_to_job'),
]
