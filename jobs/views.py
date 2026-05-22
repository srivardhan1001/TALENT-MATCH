from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsRecruiterOrAdmin, IsOwnerOrAdmin
from .models import Job
from .serializers import JobSerializer, JobDetailSerializer


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(is_active=True)
    serializer_class = JobSerializer
    permission_classes = [IsRecruiterOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['created_by', 'minimum_experience', 'education']
    search_fields = ['title', 'required_skills', 'description']
    ordering_fields = ['created_at', 'title', 'minimum_experience']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return JobDetailSerializer
        return JobSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Job.objects.filter(is_active=True)
        else:
            return Job.objects.filter(created_by=user, is_active=True)
    
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
