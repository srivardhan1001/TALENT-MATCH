from django.db import models
from django.contrib.auth import get_user_model
from jobs.models import Job

User = get_user_model()


class Resume(models.Model):
    STATUS_CHOICES = [
        ('shortlisted', 'Shortlisted'),
        ('moderate', 'Moderate'),
        ('rejected', 'Rejected'),
        ('pending', 'Pending'),
    ]
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='resumes')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_resumes')
    file = models.FileField(upload_to='resumes/', help_text="PDF files only")
    candidate_name = models.CharField(max_length=100, help_text="Full name of the candidate")
    candidate_email = models.EmailField(help_text="Email of the candidate")
    candidate_phone = models.CharField(max_length=20, blank=True, help_text="Phone number of the candidate")
    extracted_text = models.TextField(blank=True, help_text="Text extracted from PDF")
    match_score = models.IntegerField(default=0, help_text="Match score percentage")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    skills_found = models.TextField(blank=True, help_text="Skills found in resume")
    experience_years = models.FloatField(default=0, help_text="Total years of experience found")
    education_found = models.CharField(max_length=100, blank=True, help_text="Education level found")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True, help_text="When resume was processed")
    
    def __str__(self):
        return f"{self.candidate_name} - {self.job.title}"
    
    def get_skills_found_list(self):
        if self.skills_found:
            return [skill.strip() for skill in self.skills_found.split(',') if skill.strip()]
        return []
    
    class Meta:
        ordering = ['-uploaded_at']
        unique_together = ['job', 'candidate_email']
