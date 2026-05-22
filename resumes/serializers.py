from rest_framework import serializers
from .models import Resume
from jobs.serializers import JobSerializer


class ResumeUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            'job', 'file', 'candidate_name', 'candidate_email', 'candidate_phone'
        ]
    
    def validate_file(self, value):
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed")
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("File size must be less than 5MB")
        return value
    
    def validate_candidate_email(self, value):
        job_id = self.initial_data.get('job')
        if Resume.objects.filter(job_id=job_id, candidate_email=value).exists():
            raise serializers.ValidationError("A resume with this email already exists for this job")
        return value


class ResumeSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    uploaded_by_email = serializers.CharField(source='uploaded_by.email', read_only=True)
    skills_found_list = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Resume
        fields = [
            'id', 'job', 'job_title', 'uploaded_by', 'uploaded_by_email',
            'candidate_name', 'candidate_email', 'candidate_phone',
            'match_score', 'status', 'status_display', 'skills_found',
            'skills_found_list', 'experience_years', 'education_found',
            'uploaded_at', 'processed_at'
        ]
        read_only_fields = [
            'id', 'uploaded_by', 'uploaded_by_email', 'match_score',
            'status', 'skills_found', 'experience_years', 'education_found',
            'processed_at'
        ]
    
    def get_skills_found_list(self, obj):
        return obj.get_skills_found_list()


class ResumeDetailSerializer(ResumeSerializer):
    job = JobSerializer(read_only=True)
    
    class Meta(ResumeSerializer.Meta):
        fields = ResumeSerializer.Meta.fields
