// TalentMatch Homepage JavaScript
window.API_BASE = '/api';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('TalentMatch JS Loaded');
    checkAuthStatus();
    setupEventListeners();
});

// Check if user is already logged in
function checkAuthStatus() {
    const accessToken = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    const currentPath = window.location.pathname;
    
    // Don't redirect if already on homepage or already on dashboards
    if (currentPath === '/' || currentPath === '' ||
        currentPath === '/recruiter/' || currentPath.startsWith('/recruiter/') ||
        currentPath === '/applicant/' || currentPath.startsWith('/applicant/')) {
        return;
    }
    
    if (accessToken && user) {
        try {
            const userData = JSON.parse(user);
            const isOnRecruiter = currentPath === '/recruiter/' || currentPath.startsWith('/recruiter/');
            const isOnApplicant = currentPath === '/applicant/' || currentPath.startsWith('/applicant/');
            
            if (userData.role === 'recruiter' && !isOnRecruiter) {
                window.location.href = '/recruiter/';
            } else if (userData.role === 'applicant' && !isOnApplicant) {
                window.location.href = '/applicant/';
            } 
        } catch (e) {
            console.error('Auth check error:', e);
        }
    }
}

// Setup all event listeners
function setupEventListeners() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    const recruiterLoginForm = document.getElementById('recruiterLoginForm');
    if (recruiterLoginForm) recruiterLoginForm.addEventListener('submit', handleRecruiterLogin);
    
    const applicantLoginForm = document.getElementById('applicantLoginForm');
    if (applicantLoginForm) applicantLoginForm.addEventListener('submit', handleApplicantLogin);
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('regEmail')?.value;
    const username = document.getElementById('regUsername')?.value;
    const password = document.getElementById('regPassword')?.value;
    const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;
    const role = document.getElementById('regRole')?.value;
    
    if (!email || !username || !password || !passwordConfirm || !role) {
        showAlert('Please fill out all fields', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password, password_confirm: passwordConfirm, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showAlert('Registration successful!', 'success');
            setTimeout(() => {
                window.location.href = data.user.role === 'recruiter' ? '/recruiter/' : '/applicant/';
            }, 1000);
        } else {
            const error = data.email?.[0] || data.username?.[0] || data.password?.[0] || data.non_field_errors?.[0] || 'Registration failed';
            showAlert(error, 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
        console.error('Register error:', error);
    }
}

// Handle recruiter login
async function handleRecruiterLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('recruiterEmail')?.value;
    const password = document.getElementById('recruiterPassword')?.value;
    
    if (!email || !password) {
        showAlert('Please enter email and password', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/login/recruiter/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showAlert('Login successful!', 'success');
            setTimeout(() => window.location.href = '/recruiter/', 1000);
        } else {
            showAlert(data.error || 'Login failed', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
        console.error('Login error:', error);
    }
}

// Handle applicant login
async function handleApplicantLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('applicantEmail')?.value;
    const password = document.getElementById('applicantPassword')?.value;
    
    if (!email || !password) {
        showAlert('Please enter email and password', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/login/applicant/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showAlert('Login successful!', 'success');
            setTimeout(() => window.location.href = '/applicant/', 1000);
        } else {
            showAlert(data.error || 'Login failed', 'danger');
        }
    } catch (error) {
        showAlert('Network error', 'danger');
        console.error('Login error:', error);
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Navigation functions
function scrollToFeatures() {
    const features = document.getElementById('features');
    if (features) features.scrollIntoView({ behavior: 'smooth' });
}

function showRoleSelection() {
    const modalEl = document.getElementById('roleSelectionModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
}

function showRecruiterLogin() {
    const roleModal = document.getElementById('roleSelectionModal');
    if (roleModal) {
        const bsModal = bootstrap.Modal.getInstance(roleModal);
        if (bsModal) bsModal.hide();
    }
    const loginModal = document.getElementById('recruiterLoginModal');
    if (loginModal) new bootstrap.Modal(loginModal).show();
}

function showApplicantLogin() {
    const roleModal = document.getElementById('roleSelectionModal');
    if (roleModal) {
        const bsModal = bootstrap.Modal.getInstance(roleModal);
        if (bsModal) bsModal.hide();
    }
    const loginModal = document.getElementById('applicantLoginModal');
    if (loginModal) new bootstrap.Modal(loginModal).show();
}

function showRegister() {
    const modalEl = document.getElementById('registerModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/';
}


// Animation functions
function initAnimations() {
    // Add fade-in animation to elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Observe stat boxes
    document.querySelectorAll('.stat-box').forEach(box => {
        box.style.opacity = '0';
        box.style.transform = 'translateY(30px)';
        box.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(box);
    });
}

function initCounters() {
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 16); // 60fps
                let current = 0;
                
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    // Observe all stat numbers
    document.querySelectorAll('.stat-number').forEach(counter => {
        counterObserver.observe(counter);
    });
}

function initScrollEffects() {
    // Add parallax effect to hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero-section');
        const heroContent = document.querySelector('.hero-content');
        
        if (heroSection && heroContent) {
            heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
            heroContent.style.opacity = 1 - scrolled / 600;
        }
    });
    
    // Add hover effects to feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add smooth reveal animation for steps
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            step.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            step.style.opacity = '1';
            step.style.transform = 'translateY(0)';
        }, 200 * index);
    });
}

// Add floating animation to shapes
function animateShapes() {
    const shapes = document.querySelectorAll('.floating-shape');
    shapes.forEach((shape, index) => {
        shape.style.animationDelay = `${index * 0.5}s`;
    });
}

// Initialize shape animations
animateShapes();

// Add typing effect to hero title
function typeWriter() {
    const title = document.querySelector('.hero-title');
    if (!title) return;
    
    const text = title.textContent;
    title.textContent = '';
    title.style.borderRight = '3px solid white';
    
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            title.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
            title.style.borderRight = 'none';
        }
    }, 50);
}

// Initialize typing effect when page loads
window.addEventListener('load', () => {
    setTimeout(typeWriter, 500);
});

// Add smooth reveal for CTA section
function revealCTA() {
    const ctaSection = document.querySelector('.cta-section');
    if (!ctaSection) return;
    
    const ctaObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'scale(1)';
            }
        });
    }, { threshold: 0.3 });
    
    ctaSection.style.opacity = '0';
    ctaSection.style.transform = 'scale(0.95)';
    ctaSection.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    ctaObserver.observe(ctaSection);
}

// Initialize CTA reveal
revealCTA();

// Add particle effect to hero section
function createParticles() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.background = 'rgba(255, 255, 255, 0.5)';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${3 + Math.random() * 4}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        heroSection.appendChild(particle);
    }
}

// Initialize particles
createParticles();
