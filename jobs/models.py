from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Job(models.Model):
    title = models.CharField(max_length=200)
    required_skills = models.TextField(help_text="Comma-separated skills")
    minimum_experience = models.IntegerField(help_text="Years of experience")
    education = models.CharField(max_length=100, blank=True, null=True, help_text="Required education level")
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.title} - {self.created_by.email}"
    
    def get_skills_list(self):
        return [skill.strip() for skill in self.required_skills.split(',') if skill.strip()]
    
    class Meta:
        ordering = ['-created_at']
