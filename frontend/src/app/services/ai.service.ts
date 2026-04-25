import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InsightsResponse {
  summary: string;
  insights: string[];
  score: number | null;
  responseRate?: number;
  interviewRate?: number;
  usedOpenAI: boolean;
}

export interface ResumeTipsResponse {
  tips: string[];
  usedOpenAI: boolean;
}

export interface InterviewQuestionsResponse {
  behavioral: string[];
  technical: string[];
  toAsk: string[];
  usedOpenAI: boolean;
}

export interface ResumeAnalyzerResponse {
  score: number;
  scoreBreakdown: {
    contentStrength: number;
    keywordRelevance: number;
    quantification: number;
  };
  presentKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  gaps: { keyword: string; severity: 'low' | 'medium' | 'high'; suggestion: string }[];
  bulletRecommendations: string[];
  usedOpenAI: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly base = environment.apiBase;

  constructor(private http: HttpClient) {}

  getInsights(stats: any): Observable<InsightsResponse> {
    return this.http.post<InsightsResponse>(`${this.base}/ai/insights`, { stats });
  }

  getResumeTips(jobTitle: string, companyName: string, notes?: string): Observable<ResumeTipsResponse> {
    return this.http.post<ResumeTipsResponse>(`${this.base}/ai/resume-tips`, { jobTitle, companyName, notes });
  }

  getInterviewQuestions(jobTitle: string, companyName: string, notes?: string): Observable<InterviewQuestionsResponse> {
    return this.http.post<InterviewQuestionsResponse>(`${this.base}/ai/interview-questions`, { jobTitle, companyName, notes });
  }

  analyzeResume(resumeText: string, jobTitle: string, companyName: string, jobDescription?: string): Observable<ResumeAnalyzerResponse> {
    return this.http.post<ResumeAnalyzerResponse>(`${this.base}/resume-analyzer/analyze`, { 
      resumeText, 
      jobTitle, 
      companyName,
      jobDescription
    });
  }

  analyzeResumeFile(file: File, jobTitle: string, companyName: string, jobDescription?: string): Observable<ResumeAnalyzerResponse> {
    const formData = new FormData();
    formData.append('resumeFile', file, file.name);
    formData.append('jobTitle', jobTitle);
    formData.append('companyName', companyName);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }
    return this.http.post<ResumeAnalyzerResponse>(`${this.base}/resume-analyzer/analyze`, formData);
  }
}
