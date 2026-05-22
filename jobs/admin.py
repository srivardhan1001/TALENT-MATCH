from django.contrib import admin
from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'minimum_experience', 'education', 'is_active', 'created_at')
    list_filter = ('is_active', 'minimum_experience', 'education', 'created_at')
    search_fields = ('title', 'required_skills', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description')
        }),
        ('Requirements', {
            'fields': ('required_skills', 'minimum_experience', 'education')
        }),
        ('Metadata', {
            'fields': ('created_by', 'is_active', 'created_at', 'updated_at')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing existing object
            return self.readonly_fields + ('created_by',)
        return self.readonly_fields
    
    def save_model(self, request, obj, form, change):
        if not change:  # creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
