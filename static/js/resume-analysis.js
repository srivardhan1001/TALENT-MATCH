// Helper functions for resume analysis
function calculateSkillsScore(resume) {
    // This would normally come from the backend, but we'll estimate based on match score
    // Skills are 60% of total score, so reverse calculate
    return Math.round((resume.match_score * 0.6) / 0.6);
}

function calculateExperienceScore(resume) {
    // Experience is 30% of total score
    return Math.round((resume.match_score * 0.3) / 0.3);
}

function calculateEducationScore(resume) {
    // Education is 10% of total score
    return Math.round((resume.match_score * 0.1) / 0.1);
}

function getProgressBarColor(score) {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
}

function isSkillFound(skill, skillsFoundList) {
    return skillsFoundList && skillsFoundList.some(foundSkill => 
        foundSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(foundSkill.toLowerCase())
    );
}

async function getRequiredSkillsForJob(jobTitle) {
    // This would normally fetch from the job API, but for now we'll return common skills
    const commonSkills = {
        'Backend Developer': ['python', 'django', 'rest api', 'postgresql', 'git'],
        'Frontend Developer': ['javascript', 'react', 'html', 'css', 'typescript'],
        'Full Stack Developer': ['javascript', 'python', 'react', 'node.js', 'sql'],
        'DevOps Engineer': ['docker', 'kubernetes', 'aws', 'linux', 'jenkins'],
        'Data Scientist': ['python', 'machine learning', 'pandas', 'numpy', 'tensorflow']
    };
    
    // Extract skills based on job title keywords
    for (const [title, skills] of Object.entries(commonSkills)) {
        if (jobTitle.toLowerCase().includes(title.toLowerCase())) {
            return skills;
        }
    }
    
    // Default skills if no match found
    return ['python', 'javascript', 'sql', 'git', 'communication'];
}

function generateRejectionAnalysis(resume) {
    const reasons = [];
    const suggestions = [];
    
    // Analyze skills gap
    const requiredSkills = getRequiredSkillsForJob(resume.job_title);
    const missingSkills = requiredSkills.filter(skill => !isSkillFound(skill, resume.skills_found_list));
    
    if (missingSkills.length > 0) {
        reasons.push(`
            <div class="alert alert-warning mb-3">
                <h6><i class="bi bi-exclamation-triangle me-2"></i>Skills Gap</h6>
                <p>The candidate is missing several key skills required for this position:</p>
                <div class="skills-list">
                    ${missingSkills.map(skill => `<span class="skill-tag bg-danger text-white">${skill}</span>`).join('')}
                </div>
            </div>
        `);
        
        suggestions.push(`
            <div class="alert alert-info mb-3">
                <h6><i class="bi bi-lightbulb me-2"></i>Recommendation</h6>
                <p>Consider candidates who have experience with <strong>${missingSkills.join(', ')}</strong>. 
                These skills are essential for success in this role.</p>
            </div>
        `);
    }
    
    // Analyze experience gap
    if (resume.experience_years < 2) {
        reasons.push(`
            <div class="alert alert-warning mb-3">
                <h6><i class="bi bi-clock me-2"></i>Experience Level</h6>
                <p>Candidate has only ${resume.experience_years} year(s) of experience. 
                This position typically requires 2+ years of relevant experience.</p>
            </div>
        `);
        
        suggestions.push(`
            <div class="alert alert-info mb-3">
                <h6><i class="bi bi-lightbulb me-2"></i>Alternative</h6>
                <p>Consider this candidate for an entry-level or junior position, 
                or look for candidates with more demonstrated experience.</p>
            </div>
        `);
    }
    
    // Analyze education gap
    if (!resume.education_found || resume.education_found === 'not specified') {
        reasons.push(`
            <div class="alert alert-warning mb-3">
                <h6><i class="bi bi-mortarboard me-2"></i>Education Requirements</h6>
                <p>Could not detect relevant education information from the resume. 
                This position may require specific educational qualifications.</p>
            </div>
        `);
    }
    
    // Overall score analysis
    if (resume.match_score < 30) {
        reasons.push(`
            <div class="alert alert-danger mb-3">
                <h6><i class="bi bi-x-circle me-2"></i>Low Overall Match</h6>
                <p>The overall match score of ${resume.match_score}% indicates this candidate 
                is not well-suited for this position. Multiple critical requirements are not met.</p>
            </div>
        `);
    }
    
    // Generate final analysis
    let analysis = '';
    
    if (reasons.length === 0) {
        analysis = `
            <div class="alert alert-success">
                <h6><i class="bi bi-check-circle me-2"></i>No Major Issues Detected</h6>
                <p>While this resume was not selected, there are no significant gaps in qualifications. 
                The decision may be based on comparative analysis with other candidates.</p>
            </div>
        `;
    } else {
        analysis = reasons.join('') + suggestions.join('');
    }
    
    // Add improvement suggestions
    analysis += `
        <div class="card mt-3">
            <div class="card-header bg-light">
                <h6 class="mb-0"><i class="bi bi-arrow-up-circle me-2"></i>For Future Candidates</h6>
            </div>
            <div class="card-body">
                <ul class="mb-0">
                    <li>Ensure all required skills are clearly listed and demonstrated in the resume</li>
                    <li>Provide specific examples of projects using relevant technologies</li>
                    <li>Include quantifiable achievements and experience duration</li>
                    <li>Clearly state educational qualifications and certifications</li>
                    <li>Tailor the resume to specifically address the job requirements</li>
                </ul>
            </div>
        </div>
    `;
    
    return analysis;
}
