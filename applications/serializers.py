from rest_framework import serializers
from django.contrib.auth import get_user_model
from jobs.models import Job
from .models import Application

User = get_user_model()


class ApplicationSerializer(serializers.ModelSerializer):
    applicant_email = serializers.EmailField(source='applicant.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_recruiter = serializers.EmailField(source='job.created_by.email', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'applicant', 'applicant_email', 'job', 'job_title', 
            'job_recruiter', 'resume', 'match_score', 'status', 
            'applied_at', 'updated_at'
        ]
        read_only_fields = ['applicant', 'match_score', 'applied_at', 'updated_at']


class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['job', 'resume']
    
    def validate(self, attrs):
        user = self.context['request'].user
        job = attrs['job']
        
        # Check if user has already applied to this job
        if Application.objects.filter(applicant=user, job=job).exists():
            raise serializers.ValidationError("You have already applied to this job.")
        
        # Check if user is applying to their own job (if they're a recruiter)
        if job.created_by == user:
            raise serializers.ValidationError("You cannot apply to your own job posting.")
        
        attrs['applicant'] = user
        return attrs


class JobApplicationListSerializer(serializers.ModelSerializer):
    applications_count = serializers.SerializerMethodField()
    shortlisted_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'required_skills', 'minimum_experience', 
            'education', 'created_at', 'is_active', 'applications_count', 
            'shortlisted_count'
        ]
    
    def get_applications_count(self, obj):
        return obj.applications.count()
    
    def get_shortlisted_count(self, obj):
        return obj.applications.filter(status='shortlisted').count()
