from rest_framework import permissions


class IsRecruiter(permissions.BasePermission):
    """
    Allows access only to recruiter users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'recruiter'
        )
    
    def has_object_permission(self, request, view, obj):
        # Recruiters can only access their own jobs
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'job') and hasattr(obj.job, 'created_by'):
            return obj.job.created_by == request.user
        return True


class IsApplicant(permissions.BasePermission):
    """
    Allows access only to applicant users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'applicant'
        )
    
    def has_object_permission(self, request, view, obj):
        # Applicants can only access their own applications
        if hasattr(obj, 'applicant'):
            return obj.applicant == request.user
        return True


class IsRecruiterOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['recruiter', 'admin']


class IsAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        return obj.created_by == request.user


class IsOwnerOrRecruiter(permissions.BasePermission):
    """
    Allows access if user is the owner or a recruiter.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # If user is recruiter, check if they own the job
        if request.user.role == 'recruiter':
            if hasattr(obj, 'created_by'):
                return obj.created_by == request.user
            elif hasattr(obj, 'job') and hasattr(obj.job, 'created_by'):
                return obj.job.created_by == request.user
        # If user is applicant, check if they own the application
        elif request.user.role == 'applicant':
            if hasattr(obj, 'applicant'):
                return obj.applicant == request.user
        return False
