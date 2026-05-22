// Recruiter Dashboard JavaScript
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
    validateRecruiterAccess();
    
    // Load dashboard data
    loadDashboardStats();
    loadRecentApplications();
    loadTopCandidates();
    
    // Setup form handlers
    setupFormHandlers();
});

// Validate recruiter access
async function validateRecruiterAccess() {
    try {
        const response = await fetch(`${window.API_BASE}/auth/profile/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            
            if (data.role !== 'recruiter') {
                showAlert('Access denied. This dashboard is for recruiters only.', 'danger');
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
        const response = await fetch(`${window.API_BASE}/dashboard/stats/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('totalJobs').textContent = data.total_jobs || 0;
            document.getElementById('totalApplications').textContent = data.total_applications || 0;
            document.getElementById('shortlistedCount').textContent = data.shortlisted_count || 0;
            document.getElementById('activeJobs').textContent = data.active_jobs || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent applications
async function loadRecentApplications() {
    const container = document.getElementById('recentApplications');
    try {
        const response = await fetch(`${window.API_BASE}/applications/`, {
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
                        <small class="text-muted">${app.applicant_email}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-${getStatusColor(app.status)}">${app.status}</span>
                        <div class="small text-muted">${app.match_score}%</div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-danger">Failed to load applications.</p>';
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

// Load top candidates
async function loadTopCandidates() {
    const container = document.getElementById('topCandidates');
    try {
        const response = await fetch(`${window.API_BASE}/dashboard/top-candidates/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const candidates = Array.isArray(data?.results)
                ? data.results
                : Array.isArray(data)
                ? data
                : [];
            
            if (candidates.length === 0) {
                container.innerHTML = '<p class="text-muted">No candidates yet.</p>';
                return;
            }
            
            container.innerHTML = candidates.slice(0, 5).map(candidate => `
                <div class="d-flex align-items-center mb-3">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${candidate.candidate_name}</h6>
                        <small class="text-muted">${candidate.job_title}</small>
                    </div>
                    <div class="text-end">
                        <div class="badge bg-primary">${candidate.match_score}%</div>
                        <div class="small text-muted">${candidate.status}</div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-danger">Failed to load candidates.</p>';
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
        container.innerHTML = '<p class="text-danger">Error loading candidates.</p>';
    } finally {
        if (container && container.innerHTML.includes('spinner-border')) {
            container.innerHTML = '<p class="text-muted">No candidates yet.</p>';
        }
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Job creation form
    document.getElementById('createJobForm').addEventListener('submit', handleCreateJob);
}

// Handle job creation
async function handleCreateJob(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('jobTitle').value,
        required_skills: document.getElementById('jobSkills').value,
        minimum_experience: parseInt(document.getElementById('jobExperience').value),
        education: document.getElementById('jobEducation').value,
        description: document.getElementById('jobDescription').value
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
        
        if (response.ok) {
            showAlert('Job created successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createJobModal')).hide();
            document.getElementById('createJobForm').reset();
            loadDashboardStats();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to create job', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
    }
}

// Navigation functions
function showDashboard() {
    loadDashboardStats();
    loadRecentApplications();
    loadTopCandidates();
    updateActiveNav('dashboard');
}

function showJobs() {
    // Load jobs view
    loadJobs();
    updateActiveNav('jobs');
}

function showApplications() {
    // Load applications view
    loadAllApplications();
    updateActiveNav('applications');
}

function showAnalytics() {
    // Load analytics view
    updateActiveNav('analytics');
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 class="h2">Analytics</h1>
        </div>
        <div class="row mb-4">
            <div class="col-md-3 mb-3"><div class="card shadow-sm"><div class="card-body">
                <h6 class="text-muted">Total Jobs</h6><div class="display-6" id="an_jobs">0</div>
            </div></div></div>
            <div class="col-md-3 mb-3"><div class="card shadow-sm"><div class="card-body">
                <h6 class="text-muted">Total Applications</h6><div class="display-6" id="an_apps">0</div>
            </div></div></div>
            <div class="col-md-3 mb-3"><div class="card shadow-sm"><div class="card-body">
                <h6 class="text-muted">Shortlisted</h6><div class="display-6" id="an_short">0</div>
            </div></div></div>
            <div class="col-md-3 mb-3"><div class="card shadow-sm"><div class="card-body">
                <h6 class="text-muted">Active Jobs</h6><div class="display-6" id="an_active">0</div>
            </div></div></div>
        </div>
        <div class="card"><div class="card-header bg-white"><h5 class="mb-0">Top Candidates</h5></div>
            <div class="card-body" id="an_top">
                <div class="text-muted">Loading top candidates...</div>
            </div>
        </div>
    `;
    fetch(`${window.API_BASE}/dashboard/stats/`, { headers: { 'Authorization': `Bearer ${accessToken}` }})
        .then(r => r.json().then(d => ({ok:r.ok,d})))
        .then(({ok,d}) => {
            if (!ok) return;
            document.getElementById('an_jobs').textContent = d.total_jobs || 0;
            document.getElementById('an_apps').textContent = d.total_applications || 0;
            document.getElementById('an_short').textContent = d.shortlisted_count || 0;
            document.getElementById('an_active').textContent = d.active_jobs || 0;
        });
    fetch(`${window.API_BASE}/dashboard/top-candidates/`, { headers: { 'Authorization': `Bearer ${accessToken}` }})
        .then(r => r.json().then(d => ({ok:r.ok,d})))
        .then(({ok,d}) => {
            const container = document.getElementById('an_top');
            const list = Array.isArray(d?.results) ? d.results : Array.isArray(d) ? d : [];
            if (!ok || list.length === 0) {
                container.innerHTML = '<p class="text-muted mb-0">No candidates yet.</p>';
                return;
            }
            container.innerHTML = list.slice(0,10).map(c => `
                <div class="d-flex align-items-center mb-2">
                    <div class="flex-grow-1">
                        <div>${c.candidate_name}</div>
                        <small class="text-muted">${c.job_title}</small>
                    </div>
                    <div style="min-width:140px">
                        <div class="progress" style="height:10px">
                            <div class="progress-bar bg-info" style="width:${c.match_score}%"></div>
                        </div>
                    </div>
                    <div class="ms-2 small">${c.match_score}%</div>
                </div>
            `).join('');
        })
        .catch(()=> {
            document.getElementById('an_top').innerHTML = '<p class="text-danger mb-0">Failed to load data.</p>';
        });
}

// Load jobs
async function loadJobs() {
    try {
        const response = await fetch(`${window.API_BASE}/jobs/`, {
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
                    <h1 class="h2">My Jobs</h1>
                    <button type="button" class="btn btn-primary" onclick="showCreateJobForm()">
                        <i class="bi bi-plus-circle me-1"></i>Create Job
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Skills</th>
                                <th>Experience</th>
                                <th>Applications</th>
                                <th>Status</th>
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
                                    <td><span class="badge bg-primary">${job.applications_count || 0}</span></td>
                                    <td><span class="status-badge ${job.is_active ? 'active' : 'inactive'}">${job.is_active ? 'Active' : 'Inactive'}</span></td>
                                    <td>${new Date(job.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewJobApplications(${job.id})">
                                            <i class="bi bi-eye"></i> View Applications
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
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
        const response = await fetch(`${window.API_BASE}/applications/`, {
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
                    <h1 class="h2">Applications</h1>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Applicant</th>
                                <th>Job</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Applied</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${applications.map(app => `
                                <tr>
                                    <td>${app.applicant_email}</td>
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
            // Auto-rescore any pending/zero-score applications to keep data fresh
            const toRescore = applications.filter(a => (a.match_score === 0 || a.match_score === '0') && a.status === 'pending');
            if (toRescore.length > 0) {
                try {
                    await Promise.all(toRescore.map(a => fetch(`${window.API_BASE}/applications/${a.id}/rescore/`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    })));
                    loadAllApplications();
                } catch (_) { /* ignore */ }
            }
        }
    } catch (error) {
        showAlert('Error loading applications', 'danger');
    }
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
        'analytics': 3
    };
    
    if (navMap[section] !== undefined) {
        document.querySelectorAll('.nav-link')[navMap[section]].classList.add('active');
    }
}

function showCreateJobForm() {
    const modal = new bootstrap.Modal(document.getElementById('createJobModal'));
    modal.show();
}

function viewJobApplications(jobId) {
    loadJobApplications(jobId);
}

function viewApplication(applicationId) {
    const body = document.getElementById('applicationDetailsBody');
    body.innerHTML = `
        <div class="text-center py-3">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
    `;
    const modal = new bootstrap.Modal(document.getElementById('applicationDetailsModal'));
    modal.show();
    fetch(`${window.API_BASE}/applications/${applicationId}/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(r => r.json().then(d => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Failed to load application');
        body.innerHTML = `
            <div class="mb-2"><strong>Applicant:</strong> ${d.applicant_email}</div>
            <div class="mb-2"><strong>Job:</strong> ${d.job_title}</div>
            <div class="mb-2"><strong>Status:</strong> <span class="badge bg-${getStatusColor(d.status)}">${d.status}</span></div>
            <div class="mb-2"><strong>Match Score:</strong> ${d.match_score}%</div>
            <div class="mb-2"><strong>Applied:</strong> ${new Date(d.applied_at).toLocaleString()}</div>
        `;
    })
    .catch(() => {
        body.innerHTML = '<p class="text-danger">Failed to load application.</p>';
    });
}

// Load applications for specific job
async function loadJobApplications(jobId) {
    try {
        const response = await fetch(`${window.API_BASE}/applications/recruiter/jobs/${jobId}/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            const apps = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
            const content = document.getElementById('content');
            content.innerHTML = `
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Job Applications</h1>
                    <button class="btn btn-outline-secondary btn-sm" onclick="showJobs()"><i class="bi bi-arrow-left"></i> Back</button>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Applicant</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Applied</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${apps.map(app => `
                                <tr>
                                    <td>${app.applicant_email}</td>
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
        } else {
            showAlert('Failed to load job applications', 'danger');
        }
    } catch (e) {
        showAlert('Network error while loading applications', 'danger');
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
