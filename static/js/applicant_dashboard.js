// Applicant Dashboard JavaScript
let currentUser = null;
let accessToken = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        console.log('No access token, redirecting to homepage');
        window.location.href = '/';
        return;
    }
    
    // Validate user role
    validateApplicantAccess();
    
    // Load dashboard data
    loadDashboardStats();
    loadRecentApplications();
    loadRecommendedJobs();
    
    // Setup form handlers
    setupFormHandlers();
});

// Validate applicant access
async function validateApplicantAccess() {
    try {
        const response = await fetch(`${window.API_BASE}/auth/profile/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            
            if (data.role !== 'applicant') {
                showAlert('Access denied. This dashboard is for applicants only.', 'danger');
                window.location.href = '/';
                return;
            }
        } else {
            logout();
        }
    } catch (error) {
        console.error('Validation error:', error);
        logout();
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${window.API_BASE}/applications/applicant/my-applications/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const applications = await response.json();
            const applicationsData = applications.results || applications;
            
            const totalApplications = applicationsData.length;
            const shortlistedApplications = applicationsData.filter(app => app.status === 'shortlisted').length;
            const avgMatchScore = totalApplications > 0 
                ? Math.round(applicationsData.reduce((sum, app) => sum + app.match_score, 0) / totalApplications)
                : 0;
            
            document.getElementById('totalApplications').textContent = totalApplications;
            document.getElementById('shortlistedApplications').textContent = shortlistedApplications;
            document.getElementById('avgMatchScore').textContent = avgMatchScore + '%';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
    
    // Load available jobs count
    try {
        const response = await fetch(`${window.API_BASE}/applications/jobs/available/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const jobs = await response.json();
            const jobsData = jobs.results || jobs;
            document.getElementById('availableJobsCount').textContent = jobsData.length;
        }
    } catch (error) {
        console.error('Error loading available jobs:', error);
    }
}

// Load recent applications
async function loadRecentApplications() {
    const container = document.getElementById('recentApplications');
    try {
        const response = await fetch(`${window.API_BASE}/applications/applicant/my-applications/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const applications = Array.isArray(data?.results)
                ? data.results
                : Array.isArray(data)
                ? data
                : [];
            
            if (applications.length === 0) {
                container.innerHTML = '<p class="text-muted">No applications yet.</p>';
                return;
            }
            
            container.innerHTML = applications.slice(0, 5).map(app => `
                <div class="d-flex align-items-center mb-3">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${app.job_title}</h6>
                        <small class="text-muted">Applied: ${new Date(app.applied_at).toLocaleDateString()}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-${getStatusColor(app.status)}">${app.status}</span>
                        <div class="small text-muted">${app.match_score}%</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        container.innerHTML = '<p class="text-danger">Error loading applications.</p>';
    } finally {
        if (container && container.innerHTML.includes('spinner-border')) {
            container.innerHTML = '<p class="text-muted">No applications yet.</p>';
        }
    }
}

// Load recommended jobs
async function loadRecommendedJobs() {
    const container = document.getElementById('recommendedJobs');
    try {
        const response = await fetch(`${window.API_BASE}/applications/jobs/available/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const jobs = Array.isArray(data?.results)
                ? data.results
                : Array.isArray(data)
                ? data
                : [];
            
            if (jobs.length === 0) {
                container.innerHTML = '<p class="text-muted">No jobs available.</p>';
                return;
            }
            
            container.innerHTML = jobs.slice(0, 5).map(job => `
                <div class="d-flex align-items-center mb-3">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${job.title}</h6>
                        <small class="text-muted">${job.minimum_experience} years exp</small>
                    </div>
                    <div class="text-end">
                        <button class="btn btn-sm btn-success" onclick="applyToJob(${job.id}, '${job.title}')">
                            <i class="bi bi-send"></i> Apply
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        container.innerHTML = '<p class="text-danger">Error loading jobs.</p>';
    } finally {
        if (container && container.innerHTML.includes('spinner-border')) {
            container.innerHTML = '<p class="text-muted">No jobs available.</p>';
        }
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Job application form
    document.getElementById('applyJobForm').addEventListener('submit', handleJobApplication);
}

// Navigation functions
function showDashboard() {
    loadDashboardStats();
    loadRecentApplications();
    loadRecommendedJobs();
    updateActiveNav('dashboard');
}

function showAvailableJobs() {
    loadAvailableJobs();
    updateActiveNav('jobs');
}

function showMyApplications() {
    loadAllApplications();
    updateActiveNav('applications');
}

function showProfile() {
    loadProfile();
    updateActiveNav('profile');
}

// Load available jobs
async function loadAvailableJobs() {
    try {
        const response = await fetch(`${window.API_BASE}/applications/jobs/available/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const jobs = data.results || data;
            
            const content = document.getElementById('content');
            content.innerHTML = `
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Available Jobs</h1>
                </div>
                <div class="row">
                    ${jobs.map(job => `
                        <div class="col-lg-4 col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">${job.title}</h5>
                                    <p class="card-text">
                                        <small class="text-muted">
                                            <i class="bi bi-briefcase me-1"></i>${job.minimum_experience} years experience
                                        </small><br>
                                        <small class="text-muted">
                                            <i class="bi bi-mortarboard me-1"></i>${job.education || 'Not specified'}
                                        </small>
                                    </p>
                                    <div class="mb-2">
                                        ${
                                            (job.required_skills || '')
                                                .split(',')
                                                .map(s => s.trim())
                                                .filter(Boolean)
                                                .map(skill => `<span class="badge bg-light text-dark me-1">${skill}</span>`)
                                                .join('') || 'No skills specified'
                                        }
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">
                                            <i class="bi bi-calendar me-1"></i>${new Date(job.created_at).toLocaleDateString()}
                                        </small>
                                        <button class="btn btn-success btn-sm" onclick="applyToJob(${job.id}, '${job.title}')">
                                            <i class="bi bi-send me-1"></i>Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        showAlert('Error loading jobs', 'danger');
    }
}

// Load all applications
async function loadAllApplications() {
    try {
        const response = await fetch(`${window.API_BASE}/applications/applicant/my-applications/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const applications = data.results || data;
            
            const content = document.getElementById('content');
            content.innerHTML = `
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">My Applications</h1>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Job</th>
                                <th>Match Score</th>
                                <th>Status</th>
                                <th>Applied</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${applications.map(app => `
                                <tr>
                                    <td>${app.job_title}</td>
                                    <td><span class="badge bg-info">${app.match_score}%</span></td>
                                    <td><span class="status-badge ${app.status}">${app.status}</span></td>
                                    <td>${new Date(app.applied_at).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewApplication(${app.id})">
                                            <i class="bi bi-eye"></i> View
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            // Trigger rescore for stale applications and reload once
            const toRescore = applications.filter(a => (a.match_score === 0 || a.match_score === '0') && a.status === 'pending');
            if (toRescore.length > 0) {
                try {
                    await Promise.all(toRescore.map(a => fetch(`${window.API_BASE}/applications/${a.id}/rescore/`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    })));
                    // reload to reflect updated scores
                    loadAllApplications();
                } catch (_) { /* ignore */ }
            }
        }
    } catch (error) {
        showAlert('Error loading applications', 'danger');
    }
}

// Load profile
function loadProfile() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">My Profile</h1>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Personal Information</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Email:</strong> ${currentUser.email}</p>
                        <p><strong>Username:</strong> ${currentUser.username}</p>
                        <p><strong>Role:</strong> <span class="badge bg-info">${currentUser.role}</span></p>
                        <p><strong>Member Since:</strong> ${new Date(currentUser.created_at).toLocaleDateString()}</p>
                        <div class="mt-3">
                            <button class="btn btn-primary me-2" onclick="openEditProfileModal()">Edit Profile</button>
                            <button class="btn btn-outline-secondary" onclick="openChangePasswordModal()">Change Password</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>Account Settings</h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-0">Manage your profile and password using the buttons on the left.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Edit Profile
function openEditProfileModal() {
    document.getElementById('editUsername').value = currentUser.username || '';
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

async function submitProfileUpdate() {
    let username = document.getElementById('editUsername').value?.trim();
    if (!username) {
        showAlert('Username is required', 'warning');
        return;
    }
    // sanitize: replace spaces with underscores and validate allowed characters
    username = username.replace(/\s+/g, '_');
    const allowed = /^[\w.@+-]+$/;
    if (!allowed.test(username)) {
        showAlert('Only letters, numbers and @/./+/-/_ are allowed', 'warning');
        return;
    }
    try {
        const response = await fetch(`${window.API_BASE}/auth/profile/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });
        let data = null;
        try { data = await response.json(); } catch (_) {}
        if (response.ok && data) {
            currentUser = data;
            localStorage.setItem('user', JSON.stringify(data));
            showAlert('Profile updated', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
            loadProfile();
        } else {
            // surface server-side validation if present
            const msg = data?.username?.[0] || data?.detail || data?.error || 'Failed to update profile';
            showAlert(msg, 'danger');
        }
    } catch (e) {
        showAlert('Network error', 'danger');
    }
}

// Change Password
function openChangePasswordModal() {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
}

async function submitChangePassword() {
    const current_password = document.getElementById('currentPassword').value;
    const new_password = document.getElementById('newPassword').value;
    const confirm_password = document.getElementById('confirmPassword').value;
    if (!current_password || !new_password || !confirm_password) {
        showAlert('All password fields are required', 'warning');
        return;
    }
    if (new_password !== confirm_password) {
        showAlert('New passwords do not match', 'warning');
        return;
    }
    try {
        const response = await fetch(`${window.API_BASE}/auth/change-password/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ current_password, new_password })
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Password changed successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
        } else {
            showAlert(data.error || 'Failed to change password', 'danger');
        }
    } catch (e) {
        showAlert('Network error', 'danger');
    }
}

// Applicant analytics
async function showAnalytics() {
    updateActiveNav('analytics');
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Analytics</h1>
        </div>
        <div class="row" id="analyticsCards">
            <div class="col-md-4 mb-4">
                <div class="card shadow-sm"><div class="card-body">
                    <h6 class="text-muted mb-2">Total Applications</h6>
                    <div class="display-6" id="a_total">0</div>
                </div></div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card shadow-sm"><div class="card-body">
                    <h6 class="text-muted mb-2">Shortlisted Rate</h6>
                    <div class="progress" style="height:14px">
                        <div class="progress-bar bg-success" id="a_shortlisted" style="width:0%">0%</div>
                    </div>
                </div></div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card shadow-sm"><div class="card-body">
                    <h6 class="text-muted mb-2">Average Match Score</h6>
                    <div class="progress" style="height:14px">
                        <div class="progress-bar bg-info" id="a_avg" style="width:0%">0%</div>
                    </div>
                </div></div>
            </div>
        </div>
    `;
    try {
        const resp = await fetch(`${window.API_BASE}/applications/applicant/my-applications/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (resp.ok) {
            const body = await resp.json();
            const apps = Array.isArray(body?.results) ? body.results : Array.isArray(body) ? body : [];
            const total = apps.length;
            const shortlisted = apps.filter(a => a.status === 'shortlisted').length;
            const avg = total ? Math.round(apps.reduce((s,a)=>s+(a.match_score||0),0)/total) : 0;
            document.getElementById('a_total').textContent = total;
            const rate = total ? Math.round((shortlisted/total)*100) : 0;
            document.getElementById('a_shortlisted').style.width = rate+'%';
            document.getElementById('a_shortlisted').textContent = rate+'%';
            document.getElementById('a_avg').style.width = avg+'%';
            document.getElementById('a_avg').textContent = avg+'%';
        }
    } catch (e) {
        showAlert('Failed to load analytics', 'danger');
    }
}

// Apply to job
function applyToJob(jobId, jobTitle) {
    document.getElementById('jobTitle').value = jobTitle;
    document.getElementById('applyJobForm').dataset.jobId = jobId;
    
    const modal = new bootstrap.Modal(document.getElementById('applyJobModal'));
    modal.show();
}

// Handle job application
async function handleJobApplication(e) {
    e.preventDefault();
    
    const jobId = document.getElementById('applyJobForm').dataset.jobId;
    const resumeFile = document.getElementById('resumeFile').files[0];
    
    if (!resumeFile) {
        showAlert('Please upload your resume', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('resume', resumeFile);
    
    try {
        const response = await fetch(`${window.API_BASE}/applications/jobs/${jobId}/apply/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            showAlert('Application submitted successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('applyJobModal')).hide();
            document.getElementById('applyJobForm').reset();
            loadDashboardStats();
            loadRecentApplications();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to submit application', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

// View application details
function viewApplication(applicationId) {
    const modalBodyId = 'appApplicationDetailsBody';
    const existing = document.getElementById('appApplicationDetailsModal');
    if (existing) {
        document.getElementById(modalBodyId).innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
        `;
    }
    const modal = new bootstrap.Modal(document.getElementById('appApplicationDetailsModal'));
    modal.show();
    fetch(`${window.API_BASE}/applications/${applicationId}/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(r => r.json().then(d => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
        const body = document.getElementById(modalBodyId);
        if (!ok) {
            body.innerHTML = '<p class="text-danger mb-0">Failed to load application.</p>';
            return;
        }
        body.innerHTML = `
            <div class="mb-2"><strong>Job:</strong> ${d.job_title}</div>
            <div class="mb-2"><strong>Status:</strong> <span class="badge bg-${getStatusColor(d.status)}">${d.status}</span></div>
            <div class="mb-2"><strong>Match Score:</strong> ${d.match_score}%</div>
            <div class="mb-2"><strong>Applied:</strong> ${new Date(d.applied_at).toLocaleString()}</div>
        `;
    })
    .catch(() => {
        document.getElementById(modalBodyId).innerHTML = '<p class="text-danger mb-0">Failed to load application.</p>';
    });
}

// Utility functions
function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'shortlisted': 'success',
        'rejected': 'danger',
        'moderate': 'info'
    };
    return colors[status] || 'secondary';
}

function updateActiveNav(section) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const navMap = {
        'dashboard': 0,
        'jobs': 1,
        'applications': 2,
        'profile': 3,
        'analytics': 4
    };
    
    if (navMap[section] !== undefined) {
        document.querySelectorAll('.nav-link')[navMap[section]].classList.add('active');
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/';
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
