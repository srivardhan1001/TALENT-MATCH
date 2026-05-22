from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    skills_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'required_skills', 'skills_list', 
            'minimum_experience', 'education', 'description',
            'created_by', 'created_by_email', 'created_at', 
            'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_email', 'created_at', 'updated_at']
    
    def get_skills_list(self, obj):
        return obj.get_skills_list()
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class JobDetailSerializer(JobSerializer):
    resumes_count = serializers.SerializerMethodField()
    
    class Meta(JobSerializer.Meta):
        fields = JobSerializer.Meta.fields + ['resumes_count']
    
    def get_resumes_count(self, obj):
        return obj.resumes.count()
