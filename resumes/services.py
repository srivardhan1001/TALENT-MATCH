import re
from datetime import datetime
from PyPDF2 import PdfReader
from jobs.models import Job
from .models import Resume


class ResumeScoringService:
    
    def __init__(self, resume: Resume):
        self.resume = resume
        self.job = resume.job
        self.resume_text = resume.extracted_text.lower()
        self.required_skills = [skill.strip().lower() for skill in self.job.required_skills.split(',') if skill.strip()]
    
    def extract_text_from_pdf(self, pdf_file):
        try:
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            return ""
    
    def calculate_skills_score(self):
        if not self.required_skills:
            return 0
        
        skills_found = []
        for skill in self.required_skills:
            if skill in self.resume_text:
                skills_found.append(skill)
        
        self.resume.skills_found = ", ".join(skills_found)
        skills_match_percentage = (len(skills_found) / len(self.required_skills)) * 100
        return skills_match_percentage
    
    def extract_experience_years(self):
        experience_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'experience\s*:?\s*(\d+)\+?\s*years?',
            r'worked\s*(?:for|at)\s*(\d+)\+?\s*years?',
            r'total\s*experience\s*:?\s*(\d+)\+?\s*years?',
        ]
        
        max_years = 0
        for pattern in experience_patterns:
            matches = re.findall(pattern, self.resume_text)
            for match in matches:
                try:
                    years = int(match)
                    max_years = max(max_years, years)
                except ValueError:
                    continue
        
        self.resume.experience_years = max_years
        return max_years
    
    def calculate_experience_score(self):
        candidate_experience = self.extract_experience_years()
        required_experience = self.job.minimum_experience
        
        if candidate_experience >= required_experience:
            return 100
        elif candidate_experience >= required_experience * 0.8:
            return 70
        elif candidate_experience >= required_experience * 0.5:
            return 40
        else:
            return 10
    
    def extract_education_level(self):
        education_keywords = {
            'phd': ['phd', 'doctorate', 'doctor of philosophy'],
            'masters': ['master', 'm.s', 'm.sc', 'mba', 'm.tech'],
            'bachelors': ['bachelor', 'b.s', 'b.sc', 'b.tech', 'b.e', 'b.com'],
            'diploma': ['diploma', 'associate'],
        }
        
        education_found = None
        for level, keywords in education_keywords.items():
            for keyword in keywords:
                if keyword in self.resume_text:
                    education_found = level
                    break
            if education_found:
                break
        
        self.resume.education_found = education_found or 'not specified'
        return education_found
    
    def calculate_education_score(self):
        candidate_education = self.extract_education_level()
        required_education = self.job.education.lower() if self.job.education else None
        
        if not required_education:
            return 100
        
        education_hierarchy = {
            'phd': 4,
            'masters': 3,
            'bachelors': 2,
            'diploma': 1,
        }
        
        candidate_level = education_hierarchy.get(candidate_education, 0)
        required_level = education_hierarchy.get(required_education.lower(), 0)
        
        if candidate_level >= required_level:
            return 100
        elif candidate_level == required_level - 1:
            return 60
        else:
            return 20
    
    def calculate_final_score(self):
        skills_score = self.calculate_skills_score()
        experience_score = self.calculate_experience_score()
        education_score = self.calculate_education_score()
        
        final_score = (
            skills_score * 0.6 +
            experience_score * 0.3 +
            education_score * 0.1
        )
        
        self.resume.match_score = round(final_score)
        
        if final_score >= 80:
            self.resume.status = 'shortlisted'
        elif final_score >= 50:
            self.resume.status = 'moderate'
        else:
            self.resume.status = 'rejected'
        
        return round(final_score)
    
    def process_resume(self):
        if not self.resume.extracted_text:
            self.resume.extracted_text = self.extract_text_from_pdf(self.resume.file)
        
        final_score = self.calculate_final_score()
        self.resume.processed_at = datetime.now()
        self.resume.save()
        
        return {
            'match_score': final_score,
            'status': self.resume.status,
            'skills_found': self.resume.get_skills_found_list(),
            'experience_years': self.resume.experience_years,
            'education_found': self.resume.education_found,
        }


def process_resume_upload(resume_id):
    try:
        resume = Resume.objects.get(id=resume_id)
        scoring_service = ResumeScoringService(resume)
        return scoring_service.process_resume()
    except Resume.DoesNotExist:
        raise Exception("Resume not found")
    except Exception as e:
        raise Exception(f"Error processing resume: {str(e)}")
