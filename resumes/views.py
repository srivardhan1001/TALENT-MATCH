from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from accounts.permissions import IsRecruiterOrAdmin
from .models import Resume
from .serializers import ResumeUploadSerializer, ResumeSerializer, ResumeDetailSerializer
from .services import process_resume_upload


class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [IsRecruiterOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job', 'status', 'uploaded_by']
    search_fields = ['candidate_name', 'candidate_email', 'skills_found']
    ordering_fields = ['uploaded_at', 'match_score', 'candidate_name']
    ordering = ['-uploaded_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Resume.objects.all()
        else:
            return Resume.objects.filter(uploaded_by=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ResumeUploadSerializer
        elif self.action == 'retrieve':
            return ResumeDetailSerializer
        return ResumeSerializer
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resume = serializer.save(uploaded_by=request.user)
        
        try:
            scoring_result = process_resume_upload(resume.id)
            resume.refresh_from_db()
            response_serializer = ResumeDetailSerializer(resume)
            return Response({
                'resume': response_serializer.data,
                'scoring_result': scoring_result
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': f'Resume uploaded but scoring failed: {str(e)}',
                'resume': ResumeSerializer(resume).data
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def reprocess(self, request):
        resume_id = request.data.get('resume_id')
        if not resume_id:
            return Response({'error': 'resume_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            resume = self.get_queryset().get(id=resume_id)
            scoring_result = process_resume_upload(resume.id)
            resume.refresh_from_db()
            response_serializer = ResumeDetailSerializer(resume)
            return Response({
                'resume': response_serializer.data,
                'scoring_result': scoring_result
            })
        except Resume.DoesNotExist:
            return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_job(self, request):
        job_id = request.query_params.get('job_id')
        if not job_id:
            return Response({'error': 'job_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        resumes = self.get_queryset().filter(job_id=job_id)
        serializer = self.get_serializer(resumes, many=True)
        return Response(serializer.data)
