from django.contrib import admin
from .models import Resume


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'candidate_email', 'job', 'match_score', 'status', 'uploaded_by', 'uploaded_at')
    list_filter = ('status', 'job', 'uploaded_at', 'processed_at')
    search_fields = ('candidate_name', 'candidate_email', 'extracted_text')
    ordering = ('-uploaded_at',)
    readonly_fields = ('extracted_text', 'match_score', 'status', 'skills_found', 'experience_years', 'education_found', 'uploaded_at', 'processed_at')
    
    fieldsets = (
        ('Candidate Information', {
            'fields': ('candidate_name', 'candidate_email', 'candidate_phone')
        }),
        ('Job Information', {
            'fields': ('job', 'uploaded_by')
        }),
        ('Resume File', {
            'fields': ('file',)
        }),
        ('Analysis Results', {
            'fields': ('match_score', 'status', 'skills_found', 'experience_years', 'education_found')
        }),
        ('Extracted Data', {
            'fields': ('extracted_text',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('uploaded_at', 'processed_at')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing existing object
            return self.readonly_fields + ('uploaded_by',)
        return self.readonly_fields
    
    def save_model(self, request, obj, form, change):
        if not change:  # creating new object
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
