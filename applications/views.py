from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from jobs.models import Job
from .models import Application
from .serializers import (
    ApplicationSerializer, ApplicationCreateSerializer, 
    JobApplicationListSerializer
)
from accounts.permissions import IsRecruiter, IsApplicant, IsOwnerOrRecruiter
from django.utils.timezone import now

try:
    from PyPDF2 import PdfReader
except Exception:
    PdfReader = None

User = get_user_model()


class ApplicationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ApplicationCreateSerializer
        return ApplicationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'recruiter':
            # Recruiters see applications for their jobs only
            return Application.objects.filter(job__created_by=user)
        elif user.role == 'applicant':
            # Applicants see their own applications only
            return Application.objects.filter(applicant=user)
        return Application.objects.none()
    
    def perform_create(self, serializer):
        # This is handled in the serializer's validate method
        pass


class ApplicationDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrRecruiter]
    serializer_class = ApplicationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'recruiter':
            return Application.objects.filter(job__created_by=user)
        elif user.role == 'applicant':
            return Application.objects.filter(applicant=user)
        return Application.objects.none()


class RecruiterJobApplicationsView(generics.ListAPIView):
    permission_classes = [IsRecruiter]
    serializer_class = ApplicationSerializer
    
    def get_queryset(self):
        job_id = self.kwargs['job_id']
        return Application.objects.filter(
            job_id=job_id, 
            job__created_by=self.request.user
        )


class ApplicantApplicationsView(generics.ListAPIView):
    permission_classes = [IsApplicant]
    serializer_class = ApplicationSerializer
    
    def get_queryset(self):
        return Application.objects.filter(applicant=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_jobs(request):
    """Applicants can view available jobs"""
    if request.user.role != 'applicant':
        return Response(
            {'error': 'Access denied. This endpoint is for applicants only.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    jobs = Job.objects.filter(is_active=True)
    serializer = JobApplicationListSerializer(jobs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsApplicant])
def apply_to_job(request, job_id):
    """Applicants can apply to jobs"""
    try:
        job = Job.objects.get(id=job_id, is_active=True)
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found or not active.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if already applied
    if Application.objects.filter(applicant=request.user, job=job).exists():
        return Response(
            {'error': 'You have already applied to this job.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create application
    application = Application.objects.create(
        applicant=request.user,
        job=job,
        resume=request.FILES.get('resume')
    )
    # Simple scoring based on required skills vs resume text
    try:
        text = ''
        if application.resume and PdfReader is not None:
            application.resume.open('rb')
            reader = PdfReader(application.resume)
            for page in getattr(reader, 'pages', []):
                try:
                    text += page.extract_text() or ''
                except Exception:
                    continue
            application.resume.close()
        # Calculate skills match
        required = [s.strip().lower() for s in (job.required_skills or '').split(',') if s.strip()]
        found = 0
        haystack = (text or '').lower()
        for skill in required:
            if skill and skill in haystack:
                found += 1
        match_score = round((found / len(required)) * 100) if required else 0
        application.match_score = match_score
        if match_score >= 80:
            application.status = 'shortlisted'
        elif match_score >= 50:
            application.status = 'moderate'
        else:
            application.status = 'rejected'
        application.updated_at = now()
        application.save()
    except Exception:
        # Keep defaults if scoring fails
        pass

    serializer = ApplicationSerializer(application)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsOwnerOrRecruiter])
def rescore_application(request, pk):
    """Recalculate match_score and status for an existing application."""
    try:
        application = Application.objects.get(pk=pk)
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check via IsOwnerOrRecruiter handled by decorator
    try:
        text = ''
        if application.resume and PdfReader is not None:
            application.resume.open('rb')
            reader = PdfReader(application.resume)
            for page in getattr(reader, 'pages', []):
                try:
                    text += page.extract_text() or ''
                except Exception:
                    continue
            application.resume.close()
        required = [s.strip().lower() for s in (application.job.required_skills or '').split(',') if s.strip()]
        found = 0
        haystack = (text or '').lower()
        for skill in required:
            if skill and skill in haystack:
                found += 1
        match_score = round((found / len(required)) * 100) if required else 0
        application.match_score = match_score
        if match_score >= 80:
            application.status = 'shortlisted'
        elif match_score >= 50:
            application.status = 'moderate'
        else:
            application.status = 'rejected'
        application.updated_at = now()
        application.save()
        return Response(ApplicationSerializer(application).data)
    except Exception:
        return Response({'error': 'Failed to rescore application'}, status=status.HTTP_400_BAD_REQUEST)
