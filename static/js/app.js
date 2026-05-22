// Global variables
let currentUser = null;
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the dashboard page
    if (window.location.pathname.includes('dashboard')) {
        if (accessToken) {
            validateToken();
        } else {
            // Redirect to homepage if not authenticated
            window.location.href = '/';
        }
    }
    
    // Setup form handlers only if on dashboard
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
        document.getElementById('createJobForm').addEventListener('submit', handleCreateJob);
        document.getElementById('uploadResumeForm').addEventListener('submit', handleUploadResume);
    }
});

// Token validation
async function validateToken() {
    try {
        const response = await fetch(`${window.API_BASE}/auth/profile/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            updateUserUI();
            showDashboard();
        } else {
            logout();
        }
    } catch (error) {
        logout();
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${window.API_BASE}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            accessToken = data.access;
            refreshToken = data.refresh;
            currentUser = data.user;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            updateUserUI();
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            showDashboard();
            showAlert('Login successful!', 'success');
        } else {
            showAlert(data.error || 'Login failed', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = {
        email: document.getElementById('regEmail').value,
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
        password_confirm: document.getElementById('regPasswordConfirm').value,
        role: document.getElementById('regRole').value
    };
    
    try {
        const response = await fetch(`${window.API_BASE}/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            accessToken = data.access;
            refreshToken = data.refresh;
            currentUser = data.user;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            updateUserUI();
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            showDashboard();
            showAlert('Registration successful!', 'success');
        } else {
            showAlert(data.error || 'Registration failed', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    accessToken = null;
    refreshToken = null;
    currentUser = null;
    showLogin();
}

function updateUserUI() {
    document.getElementById('userEmail').textContent = currentUser.email;
}

// Modal functions
function showLogin() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function showRegister() {
    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

// Navigation functions
async function showDashboard() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div> Loading dashboard...</div>';
    
    try {
        const response = await fetch(`${window.API_BASE}/dashboard/summary/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderDashboard(data);
        } else {
            showAlert('Failed to load dashboard', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

function renderDashboard(data) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Welcome back! Here's your recruitment overview.</p>
        </div>
        
        <div class="row mb-4">
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon primary me-3">
                                <i class="bi bi-briefcase"></i>
                            </div>
                            <div>
                                <div class="stat-value">${data.summary.total_jobs}</div>
                                <div class="stat-label">Total Jobs</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon info me-3">
                                <i class="bi bi-file-earmark-text"></i>
                            </div>
                            <div>
                                <div class="stat-value">${data.summary.total_resumes}</div>
                                <div class="stat-label">Total Resumes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon success me-3">
                                <i class="bi bi-check-circle"></i>
                            </div>
                            <div>
                                <div class="stat-value">${data.summary.shortlisted_count}</div>
                                <div class="stat-label">Shortlisted</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon warning me-3">
                                <i class="bi bi-graph-up"></i>
                            </div>
                            <div>
                                <div class="stat-value">${data.summary.avg_score}%</div>
                                <div class="stat-label">Avg Score</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-lg-6 mb-4">
                <div class="card">
                    <div class="card-header bg-white">
                        <h5 class="mb-0">Recent Jobs</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Job Title</th>
                                        <th>Resumes</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.recent_jobs.map(job => `
                                        <tr>
                                            <td>${job.title}</td>
                                            <td><span class="badge bg-primary">${job.resumes_count}</span></td>
                                            <td>${new Date(job.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-6 mb-4">
                <div class="card">
                    <div class="card-header bg-white">
                        <h5 class="mb-0">Recent Resumes</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Job</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.recent_resumes.map(resume => `
                                        <tr>
                                            <td>${resume.candidate_name}</td>
                                            <td>${resume.job_title}</td>
                                            <td><span class="badge-score ${getScoreClass(resume.match_score)}">${resume.match_score}%</span></td>
                                            <td><span class="status-badge ${resume.status}">${resume.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function showJobs() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Jobs</h1>
            <p class="page-subtitle">Manage your job postings</p>
        </div>
        
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <button class="btn btn-gradient" onclick="showCreateJobForm()">
                    <i class="bi bi-plus-circle me-2"></i>Create Job
                </button>
            </div>
        </div>
        
        <div id="jobsContent">
            <div class="text-center py-5"><div class="loading-spinner"></div> Loading jobs...</div>
        </div>
    `;
    
    loadJobs();
}

async function loadJobs() {
    try {
        const response = await fetch(`${window.API_BASE}/jobs/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderJobs(data.results || data);
        } else {
            showAlert('Failed to load jobs', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

function renderJobs(jobs) {
    const content = document.getElementById('jobsContent');
    
    if (jobs.length === 0) {
        content.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-briefcase text-muted" style="font-size: 3rem;"></i>
                <h4 class="text-muted mt-3">No jobs yet</h4>
                <p class="text-muted">Create your first job posting to get started</p>
                <button class="btn btn-gradient" onclick="showCreateJobForm()">
                    <i class="bi bi-plus-circle me-2"></i>Create Job
                </button>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Skills</th>
                        <th>Experience</th>
                        <th>Education</th>
                        <th>Type</th>
                        <th>Deadline</th>
                        <th>Resumes</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${jobs.map(job => `
                        <tr>
                            <td><strong>${job.title}</strong></td>
                            <td>
                                <div class="skills-list">
                                    ${job.skills_list.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                                </div>
                            </td>
                            <td>${job.minimum_experience} years</td>
                            <td>${job.education || 'Not specified'}</td>
                            <td><span class="badge bg-info">${job.job_type || 'Not specified'}</span></td>
                            <td>${job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not set'}</td>
                            <td><span class="badge bg-primary">${job.resumes_count || 0}</span></td>
                            <td>${new Date(job.created_at).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewJob(${job.id})">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteJob(${job.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function showResumes() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Resumes</h1>
            <p class="page-subtitle">Manage uploaded resumes</p>
        </div>
        
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <button class="btn btn-gradient" onclick="showUploadResumeForm()">
                    <i class="bi bi-upload me-2"></i>Upload Resume
                </button>
            </div>
            <div>
                <select class="form-select" id="jobFilter" onchange="filterResumes()">
                    <option value="">All Jobs</option>
                </select>
            </div>
        </div>
        
        <div id="resumesContent">
            <div class="text-center py-5"><div class="loading-spinner"></div> Loading resumes...</div>
        </div>
    `;
    
    loadJobsForFilter();
    loadResumes();
}

async function loadResumes(jobId = null) {
    try {
        const url = jobId ? `${window.API_BASE}/resumes/by_job/?job_id=${jobId}` : `${window.API_BASE}/resumes/`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderResumes(data.results || data);
        } else {
            showAlert('Failed to load resumes', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

async function loadJobsForFilter() {
    try {
        const response = await fetch(`${window.API_BASE}/jobs/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const select = document.getElementById('jobFilter');
            const jobs = data.results || data;
            jobs.forEach(job => {
                const option = document.createElement('option');
                option.value = job.id;
                option.textContent = job.title;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load jobs for filter');
    }
}

function filterResumes() {
    const jobId = document.getElementById('jobFilter').value;
    loadResumes(jobId);
}

async function renderResumes(resumes) {
    const content = document.getElementById('resumesContent');
    
    if (resumes.length === 0) {
        content.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-file-earmark-text text-muted" style="font-size: 3rem;"></i>
                <h4 class="text-muted mt-3">No resumes yet</h4>
                <p class="text-muted">Upload your first resume to get started</p>
                <button class="btn btn-gradient" onclick="showUploadResumeForm()">
                    <i class="bi bi-upload me-2"></i>Upload Resume
                </button>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Candidate</th>
                        <th>Email</th>
                        <th>Job</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Skills</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${resumes.filter(resume => resume.job_status !== 'deleted').map(resume => `
                        <tr>
                            <td><strong>${resume.candidate_name}</strong></td>
                            <td>${resume.candidate_email}</td>
                            <td>${resume.job_title}</td>
                            <td><span class="badge-score ${getScoreClass(resume.match_score)}">${resume.match_score}%</span></td>
                            <td><span class="status-badge ${resume.status}">${resume.status}</span></td>
                            <td>
                                <div class="skills-list">
                                    ${(resume.skills_found_list || []).slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                                    ${resume.skills_found_list && resume.skills_found_list.length > 3 ? `<span class="skill-tag">+${resume.skills_found_list.length - 3}</span>` : ''}
                                </div>
                            </td>
                            <td>${new Date(resume.uploaded_at).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewResume(${resume.id})">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-warning" onclick="reprocessResume(${resume.id})">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function showTopCandidates() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div> Loading top candidates...</div>';
    
    try {
        const response = await fetch(`${window.API_BASE}/dashboard/top-candidates/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderTopCandidates(data);
        } else {
            showAlert('Failed to load top candidates', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

function renderTopCandidates(candidates) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Top Candidates</h1>
            <p class="page-subtitle">Best matching candidates (70%+ score)</p>
        </div>
        
        ${candidates.length === 0 ? `
            <div class="text-center py-5">
                <i class="bi bi-trophy text-muted" style="font-size: 3rem;"></i>
                <h4 class="text-muted mt-3">No top candidates yet</h4>
                <p class="text-muted">Upload and process more resumes to see top candidates here</p>
            </div>
        ` : `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Email</th>
                            <th>Job</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Experience</th>
                            <th>Skills</th>
                            <th>Uploaded</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${candidates.map(candidate => `
                            <tr>
                                <td><strong>${candidate.candidate_name}</strong></td>
                                <td>${candidate.candidate_email}</td>
                                <td>${candidate.job_title}</td>
                                <td><span class="badge-score ${getScoreClass(candidate.match_score)}">${candidate.match_score}%</span></td>
                                <td><span class="status-badge ${candidate.status}">${candidate.status}</span></td>
                                <td>${candidate.experience_years} years</td>
                                <td>
                                    <div class="skills-list">
                                        ${(candidate.skills_found || []).slice(0, 4).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                                        ${candidate.skills_found && candidate.skills_found.length > 4 ? `<span class="skill-tag">+${candidate.skills_found.length - 4}</span>` : ''}
                                    </div>
                                </td>
                                <td>${new Date(candidate.uploaded_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `}
    `;
}

// Helper functions
function getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-custom alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const content = document.getElementById('content');
    content.insertBefore(alertDiv, content.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Form functions
function showCreateJobForm() {
    const modal = new bootstrap.Modal(document.getElementById('createJobModal'));
    modal.show();
}

async function handleCreateJob(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('jobTitle').value,
        required_skills: document.getElementById('jobSkills').value,
        minimum_experience: parseInt(document.getElementById('jobExperience').value),
        education: document.getElementById('jobEducation').value,
        description: document.getElementById('jobDescription').value,
        deadline: document.getElementById('jobDeadline').value,
        job_type: document.getElementById('jobType').value
    };
    
    try {
        const response = await fetch(`${window.API_BASE}/jobs/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('createJobModal')).hide();
            showAlert('Job created successfully!', 'success');
            
            // Reset form
            document.getElementById('createJobForm').reset();
            
            // Reload jobs if we're on the jobs page
            if (document.getElementById('jobsContent')) {
                loadJobs();
            }
        } else {
            showAlert(data.error || 'Failed to create job', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

async function showUploadResumeForm() {
    // Load jobs for the dropdown
    try {
        const response = await fetch(`${window.API_BASE}/jobs/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const select = document.getElementById('resumeJob');
            select.innerHTML = '<option value="">Choose a job...</option>';
            
            const jobs = data.results || data;
            jobs.forEach(job => {
                const option = document.createElement('option');
                option.value = job.id;
                option.textContent = job.title;
                select.appendChild(option);
            });
            
            const modal = new bootstrap.Modal(document.getElementById('uploadResumeModal'));
            modal.show();
        } else {
            showAlert('Failed to load jobs', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

async function handleUploadResume(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('job', document.getElementById('resumeJob').value);
    formData.append('candidate_name', document.getElementById('candidateName').value);
    formData.append('candidate_email', document.getElementById('candidateEmail').value);
    formData.append('candidate_phone', document.getElementById('candidatePhone').value);
    formData.append('file', document.getElementById('resumeFile').files[0]);
    
    try {
        const response = await fetch(`${window.API_BASE}/resumes/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('uploadResumeModal')).hide();
            
            // Show success message with scoring results
            let message = 'Resume uploaded successfully!';
            if (data.scoring_result) {
                message += ` Score: ${data.scoring_result.match_score}%, Status: ${data.scoring_result.status}`;
            }
            showAlert(message, 'success');
            
            // Reset form
            document.getElementById('uploadResumeForm').reset();
            
            // Reload resumes if we're on the resumes page
            if (document.getElementById('resumesContent')) {
                loadResumes();
            }
            
            // Reload jobs filter if needed
            if (document.getElementById('jobFilter')) {
                loadJobsForFilter();
            }
        } else {
            showAlert(data.error || 'Failed to upload resume', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

async function viewJob(jobId) {
    try {
        const response = await fetch(`${window.API_BASE}/jobs/${jobId}/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Create a detailed job view modal
            const modalContent = `
                <div class="modal fade" id="viewJobModal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header border-0">
                                <h5 class="modal-title">Job Details - ${data.title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-12">
                                        <h6><i class="bi bi-briefcase me-2"></i>Job Information</h6>
                                        <div class="card mb-3">
                                            <div class="card-body">
                                                <p><strong>Title:</strong> ${data.title}</p>
                                                <p><strong>Required Skills:</strong></p>
                                                <div class="skills-list mb-3">
                                                    ${data.required_skills.split(',').map(skill => `<span class="skill-tag">${skill.trim()}</span>`).join('')}
                                                </div>
                                                <p><strong>Minimum Experience:</strong> ${data.minimum_experience} years</p>
                                                <p><strong>Education:</strong> ${data.education || 'Not specified'}</p>
                                                <p><strong>Job Type:</strong> <span class="badge bg-info">${data.job_type || 'Not specified'}</span></p>
                                                ${data.deadline ? `<p><strong>Application Deadline:</strong> ${new Date(data.deadline).toLocaleString()}</p>` : ''}
                                                <p><strong>Status:</strong> <span class="status-badge ${data.is_active ? 'active' : 'inactive'}">${data.is_active ? 'Active' : 'Inactive'}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                ${data.description ? `
                                <div class="row">
                                    <div class="col-md-12">
                                        <h6><i class="bi bi-file-text me-2"></i>Job Description</h6>
                                        <div class="card">
                                            <div class="card-body">
                                                <p>${data.description.replace(/\n/g, '<br>')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                                
                                <div class="row">
                                    <div class="col-md-12">
                                        <h6><i class="bi bi-clock me-2"></i>Job Information</h6>
                                        <div class="card">
                                            <div class="card-body">
                                                <p><strong>Created:</strong> ${new Date(data.created_at).toLocaleString()}</p>
                                                <p><strong>Last Updated:</strong> ${new Date(data.updated_at).toLocaleString()}</p>
                                                <p><strong>Resumes Count:</strong> <span class="badge bg-primary">${data.resumes_count || 0}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('viewJobModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to body and show it
            document.body.insertAdjacentHTML('beforeend', modalContent);
            const modal = new bootstrap.Modal(document.getElementById('viewJobModal'));
            modal.show();
            
            // Remove modal from DOM after it's hidden
            document.getElementById('viewJobModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });
        } else {
            showAlert('Failed to load job details', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

async function deleteJob(jobId) {
    if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        try {
            const response = await fetch(`${window.API_BASE}/jobs/${jobId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                showAlert('Job deleted successfully!', 'success');
                // Reload jobs if we're on the jobs page
                if (document.getElementById('jobsContent')) {
                    loadJobs();
                }
            } else {
                showAlert('Failed to delete job', 'danger');
            }
        } catch (error) {
            showAlert('Network error', 'danger');
        }
    }
}

async function viewResume(resumeId) {
    try {
        const response = await fetch(`${window.API_BASE}/resumes/${resumeId}/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Check if job is completed and show appropriate notification
            if (data.job_status === 'completed') {
                showAlert('The job notification has been completed', 'success');
            }
            
            // Create a simplified modal content
            const modalContent = `
                <div class="modal fade" id="viewResumeModal" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header border-0">
                                <h5 class="modal-title">Resume Details - ${data.candidate_name}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-person me-2"></i>Candidate Information</h6>
                                        <div class="card mb-3">
                                            <div class="card-body">
                                                <p><strong>Name:</strong> ${data.candidate_name}</p>
                                                <p><strong>Email:</strong> ${data.candidate_email}</p>
                                                <p><strong>Phone:</strong> ${data.candidate_phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="bi bi-briefcase me-2"></i>Job Information</h6>
                                        <div class="card mb-3">
                                            <div class="card-body">
                                                <p><strong>Job:</strong> ${data.job_title}</p>
                                                <p><strong>Job Status:</strong> <span class="status-badge ${data.job_status || 'active'}">${data.job_status || 'active'}</span></p>
                                                <p><strong>Score:</strong> <span class="badge-score ${getScoreClass(data.match_score)}">${data.match_score}%</span></p>
                                                <p><strong>Status:</strong> <span class="status-badge ${data.status}">${data.status}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                ${data.status === 'rejected' ? generateSimpleRejectionAnalysis(data) : ''}
                                
                                <div class="row">
                                    <div class="col-md-12">
                                        <h6><i class="bi bi-search me-2"></i>Analysis Results</h6>
                                        <div class="card mb-3">
                                            <div class="card-body">
                                                <p><strong>Experience:</strong> ${data.experience_years} years</p>
                                                <p><strong>Education:</strong> ${data.education_found || 'Not detected'}</p>
                                                <p><strong>Skills Found:</strong></p>
                                                <div class="skills-list">
                                                    ${(data.skills_found_list || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-12">
                                        <h6><i class="bi bi-clock me-2"></i>Upload Information</h6>
                                        <div class="card">
                                            <div class="card-body">
                                                <p><strong>Uploaded:</strong> ${new Date(data.uploaded_at).toLocaleString()}</p>
                                                <p><strong>Processed:</strong> ${data.processed_at ? new Date(data.processed_at).toLocaleString() : 'Not processed'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('viewResumeModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to body and show it
            document.body.insertAdjacentHTML('beforeend', modalContent);
            const modal = new bootstrap.Modal(document.getElementById('viewResumeModal'));
            modal.show();
            
            // Remove modal from DOM after it's hidden
            document.getElementById('viewResumeModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });
        } else {
            showAlert('Failed to load resume details', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

function generateSimpleRejectionAnalysis(resume) {
    const reasons = [];
    
    // Basic analysis
    if (resume.match_score < 50) {
        reasons.push(`
            <div class="alert alert-warning mb-3">
                <h6><i class="bi bi-exclamation-triangle me-2"></i>Low Match Score</h6>
                <p>The resume scored ${resume.match_score}%, which is below the acceptable threshold of 50%.</p>
                <p><strong>Key Issues:</strong></p>
                <ul>
                    <li>Insufficient skill match with job requirements</li>
                    <li>Experience level may not meet position requirements</li>
                    <li>Missing critical qualifications or certifications</li>
                </ul>
            </div>
        `);
    }
    
    if (reasons.length === 0) {
        reasons.push(`
            <div class="alert alert-info mb-3">
                <h6><i class="bi bi-info-circle me-2"></i>Rejection Analysis</h6>
                <p>This resume was not selected based on comparative analysis with other candidates who better matched the specific requirements of the position.</p>
            </div>
        `);
    }
    
    return reasons.join('');
}

async function reprocessResume(resumeId) {
    try {
        const response = await fetch(`${window.API_BASE}/resumes/reprocess/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ resume_id: resumeId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Resume reprocessed successfully', 'success');
            loadResumes();
        } else {
            showAlert(data.error || 'Failed to reprocess resume', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}
