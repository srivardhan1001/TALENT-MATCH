from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from jobs.models import Job
from applications.models import Application

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics for the logged-in user"""
    user = request.user
    
    if user.role == 'recruiter':
        # Recruiter stats
        total_jobs = Job.objects.filter(created_by=user).count()
        total_applications = Application.objects.filter(job__created_by=user).count()
        shortlisted_count = Application.objects.filter(job__created_by=user, status='shortlisted').count()
        active_jobs = Job.objects.filter(created_by=user, is_active=True).count()
        
        return Response({
            'total_jobs': total_jobs,
            'total_applications': total_applications,
            'shortlisted_count': shortlisted_count,
            'active_jobs': active_jobs
        })
    
    elif user.role == 'applicant':
        # Applicant stats
        total_applications = Application.objects.filter(applicant=user).count()
        shortlisted_applications = Application.objects.filter(applicant=user, status='shortlisted').count()
        avg_match_score = 0
        
        applications = Application.objects.filter(applicant=user)
        if applications.exists():
            total_score = sum(app.match_score for app in applications)
            avg_match_score = total_score // applications.count()
        
        return Response({
            'total_applications': total_applications,
            'shortlisted_applications': shortlisted_applications,
            'avg_match_score': avg_match_score
        })
    
    return Response({})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_candidates(request):
    """Get top candidates for recruiters"""
    user = request.user
    
    if user.role != 'recruiter':
        return Response({'error': 'Access denied'}, status=403)
    
    # Get top candidates from recruiter's jobs
    applications = Application.objects.filter(
        job__created_by=user
    ).order_by('-match_score')[:10]
    
    candidates = []
    for app in applications:
        candidates.append({
            'candidate_name': app.applicant.email,
            'job_title': app.job.title,
            'match_score': app.match_score,
            'status': app.status
        })
    
    return Response(candidates)
