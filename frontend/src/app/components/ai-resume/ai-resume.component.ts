import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApplicationService, Application } from '../../services/application.service';
import { AiService, ResumeAnalyzerResponse } from '../../services/ai.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ai-resume',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-fluid px-3 px-md-4 py-4 ai-resume-page">
      <header class="page-header mb-4">
        <div>
          <p class="page-eyebrow mb-1"><i class="bi bi-stars me-1"></i>AI-Powered Tool</p>
          <h1 class="page-title mb-1">Resume Analyzer</h1>
          <p class="text-muted">Paste your resume, select a job, and get detailed analysis with improvement suggestions.</p>
        </div>
      </header>

      <div class="row g-4">
        <!-- Input Panel -->
        <div class="col-lg-5">
          <div class="card h-100 input-panel">
            <div class="card-header bg-light border-bottom">
              <h5 class="mb-0 fw-bold">Upload or Paste Resume</h5>
            </div>
            <div class="card-body">
              <div class="form-group mb-3">
                <label class="form-label fw-semibold">Upload Resume</label>
                <input
                  type="file"
                  class="form-control"
                  accept=".pdf,.txt"
                  (change)="onFileSelected($event)"
                />
                <p *ngIf="selectedFile" class="small text-muted mt-2 mb-0">
                  Selected file: <strong>{{ selectedFile.name }}</strong>
                </p>
                <p *ngIf="fileError" class="small text-danger mt-2">{{ fileError }}</p>
              </div>
              <div class="form-group mb-3">
                <label class="form-label fw-semibold">Resume Text</label>
                <textarea 
                  [(ngModel)]="resumeText" 
                  class="form-control form-control-lg" 
                  rows="8"
                  placeholder="Paste your entire resume text here... (No formatting needed)"
                  (input)="updateCharCount()">
                </textarea>
                <small class="text-muted mt-2 d-block">{{ charCount }} characters</small>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <div class="form-group">
                    <label class="form-label fw-semibold">Job Title</label>
                    <select *ngIf="applications.length > 0" [(ngModel)]="selectedAppId" class="form-select" (change)="onApplicationSelected()">
                      <option value="">Choose from your applications...</option>
                      <option *ngFor="let app of applications" [value]="app._id">{{ app.jobTitle }}</option>
                    </select>
                    <input *ngIf="applications.length === 0"
                      type="text"
                      [(ngModel)]="jobTitle"
                      class="form-control"
                      placeholder="e.g. Senior Engineer"
                    />
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-group">
                    <label class="form-label fw-semibold">Company</label>
                    <input 
                      type="text" 
                      [(ngModel)]="companyName" 
                      class="form-control"
                      placeholder="e.g. Google"
                      [readonly]="!!selectedAppId"
                    />
                  </div>
                </div>
              </div>

              <div class="form-group mb-4">
                <label class="form-label fw-semibold">Job Description (Optional)</label>
                <textarea 
                  [(ngModel)]="jobDescription" 
                  class="form-control" 
                  rows="4"
                  placeholder="Paste job description for better keyword matching...">
                </textarea>
              </div>

              <button 
                class="btn btn-primary btn-lg w-100"
                (click)="analyze()"
                [disabled]="analyzing || (!selectedFile && !resumeText.trim()) || !jobTitle.trim() || !companyName.trim()"
              >
                <span *ngIf="analyzing" class="spinner-border spinner-border-sm me-2"></span>
                <span *ngIf="analyzing">Analyzing…</span>
                <span *ngIf="!analyzing"><i class="bi bi-magic me-2"></i>Analyze Resume</span>
              </button>

              <a routerLink="/applications" class="btn btn-outline-secondary w-100 mt-2">
                <i class="bi bi-arrow-left me-1"></i>Back to Applications
              </a>
            </div>
          </div>
        </div>

        <!-- Results Panel -->
        <div class="col-lg-7">
          <ng-container *ngIf="!analyzed && !analyzing">
            <div class="card h-100 empty-state">
              <div class="card-body d-flex flex-column align-items-center justify-content-center py-5">
                <i class="bi bi-file-earmark-text display-1 text-muted mb-3"></i>
                <h4 class="fw-bold mb-2">No Analysis Yet</h4>
                <p class="text-muted text-center">Paste your resume and select a job to get started. The analyzer will score your resume, identify gaps, and suggest improvements.</p>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="analyzing">
            <div class="card h-100 d-flex flex-column align-items-center justify-content-center">
              <div class="spinner-border text-primary mb-3"></div>
              <p class="text-muted fw-semibold">Analyzing your resume…</p>
            </div>
          </ng-container>

          <ng-container *ngIf="analyzed && result">
            <div class="results-panel">
              <!-- Score Card -->
              <div class="card mb-4 score-card">
                <div class="card-body">
                  <div class="d-flex align-items-start justify-content-between mb-4">
                    <div>
                      <p class="text-muted small fw-semibold mb-1">Overall Score</p>
                      <h2 class="mb-0 fw-bold score-value" [style.color]="scoreColor(result.score)">{{ result.score }}/100</h2>
                    </div>
                    <div class="score-gauge">
                      <div class="gauge-circle" [style.--score]="result.score + '%'">
                        <svg viewBox="0 0 100 100">
                          <circle class="gauge-bg" cx="50" cy="50" r="45"/>
                          <circle class="gauge-fill" cx="50" cy="50" r="45"
                            [style.stroke-dashoffset]="282.7 - (282.7 * result.score / 100)"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <!-- Score Breakdown -->
                  <div class="score-breakdown">
                    <div class="breakdown-item">
                      <div class="d-flex justify-content-between mb-1">
                        <span class="small fw-semibold">Content Strength</span>
                        <span class="small fw-bold">{{ result.scoreBreakdown.contentStrength }}%</span>
                      </div>
                      <div class="progress" style="height: 6px;">
                        <div class="progress-bar" [style.width.%]="result.scoreBreakdown.contentStrength"></div>
                      </div>
                    </div>
                    <div class="breakdown-item mt-2">
                      <div class="d-flex justify-content-between mb-1">
                        <span class="small fw-semibold">Keyword Relevance</span>
                        <span class="small fw-bold">{{ result.scoreBreakdown.keywordRelevance }}%</span>
                      </div>
                      <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-success" [style.width.%]="result.scoreBreakdown.keywordRelevance"></div>
                      </div>
                    </div>
                    <div class="breakdown-item mt-2">
                      <div class="d-flex justify-content-between mb-1">
                        <span class="small fw-semibold">Quantification</span>
                        <span class="small fw-bold">{{ result.scoreBreakdown.quantification }}%</span>
                      </div>
                      <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-warning" [style.width.%]="result.scoreBreakdown.quantification"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Keywords -->
              <div class="card mb-4">
                <div class="card-header bg-light border-bottom">
                  <h5 class="mb-0 fw-bold">Keywords Found</h5>
                </div>
                <div class="card-body">
                  <div class="keywords-grid">
                    <span *ngFor="let kw of result.presentKeywords" class="badge bg-success-light text-success">{{ kw }}</span>
                  </div>
                </div>
              </div>

              <!-- Missing Keywords -->
              <div *ngIf="result.missingKeywords.length > 0" class="card mb-4">
                <div class="card-header bg-light border-bottom">
                  <h5 class="mb-0 fw-bold"><i class="bi bi-exclamation-circle me-2 text-warning"></i>Keywords to Add</h5>
                </div>
                <div class="card-body">
                  <div class="keywords-grid">
                    <span *ngFor="let kw of result.missingKeywords" class="badge bg-warning-light text-warning">{{ kw }}</span>
                  </div>
                </div>
              </div>

              <!-- Gaps -->
              <div *ngIf="result.gaps.length > 0" class="card mb-4">
                <div class="card-header bg-light border-bottom">
                  <h5 class="mb-0 fw-bold"><i class="bi bi-diagram-3 me-2"></i>Identified Gaps</h5>
                </div>
                <div class="card-body">
                  <div class="d-flex flex-column gap-3">
                    <div *ngFor="let gap of result.gaps" class="gap-item p-3 rounded border" [class]="'border-' + gapSeverityBg(gap.severity)">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-0 fw-bold">{{ gap.keyword }}</h6>
                        <span class="badge" [ngClass]="gapSeverityBadge(gap.severity)">{{ gap.severity }}</span>
                      </div>
                      <p class="mb-0 small text-muted">{{ gap.suggestion }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Suggestions -->
              <div *ngIf="result.suggestions.length > 0" class="card mb-4">
                <div class="card-header bg-light border-bottom">
                  <h5 class="mb-0 fw-bold"><i class="bi bi-lightbulb me-2"></i>Improvement Suggestions</h5>
                </div>
                <div class="card-body">
                  <div class="d-flex flex-column gap-2">
                    <div *ngFor="let suggestion of result.suggestions" class="suggestion-item p-3 bg-light rounded">
                      <p class="mb-0 small">{{ suggestion }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bullet Rewrite Examples -->
              <div *ngIf="result.bulletRecommendations.length > 0" class="card">
                <div class="card-header bg-light border-bottom">
                  <h5 class="mb-0 fw-bold"><i class="bi bi-pencil me-2"></i>Bullet Point Rewrites</h5>
                </div>
                <div class="card-body">
                  <div class="d-flex flex-column gap-3">
                    <div *ngFor="let rec of result.bulletRecommendations" class="bullet-rec">
                      <p class="mb-0 small text-muted font-monospace">{{ rec }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div *ngIf="!result.usedOpenAI" class="alert alert-info mt-4 mb-0">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Tip:</strong> Add OPENAI_API_KEY to the backend for more detailed, AI-powered analysis.
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-resume-page { min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #f8fafc 100%); }
    
    .page-header { padding-bottom: 2rem; border-bottom: 2px solid #e2e8f0; }
    .page-eyebrow { font-size: 0.85rem; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; }
    .page-title { font-size: 2.5rem; font-weight: 700; color: #1e293b; }

    .input-panel { border: 2px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .input-panel .card-body { padding: 1.5rem; }

    .form-control-lg, .form-select { font-size: 1rem; padding: 0.75rem 1rem; }

    .empty-state { display: flex; justify-content: center; align-items: center; min-height: 500px; background: #f8fafc; }
    
    .score-card { border: 3px solid #f0f4ff; background: linear-gradient(135deg, #fafbff 0%, #f3f4f6 100%); }
    .score-value { font-size: 2.5rem; }

    .score-gauge { width: 100px; height: 100px; }
    .gauge-circle svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .gauge-bg { fill: none; stroke: #e2e8f0; stroke-width: 6; }
    .gauge-fill { fill: none; stroke-width: 6; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }

    .score-breakdown { margin-top: 1rem; }

    .keywords-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .badge { padding: 6px 12px; font-weight: 600; font-size: 0.85rem; }
    .bg-success-light { background-color: #dcfce7; }
    .text-success { color: #22c55e; }
    .bg-warning-light { background-color: #fef3c7; }
    .text-warning { color: #f59e0b; }

    .gap-item { background-color: #fafbff; }
    .border-low { border-color: #86efac; }
    .border-medium { border-color: #fbbf24; }
    .border-high { border-color: #f87171; }

    .suggestion-item { background-color: #f0f4ff; border-left: 4px solid #4f46e5; }

    .bullet-rec { padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #4f46e5; }
    .font-monospace { font-family: 'Courier New', monospace; font-size: 0.9rem; line-height: 1.6; }

    .progress { background-color: #e2e8f0; }
    .progress-bar { background-color: #4f46e5; }
    .progress-bar.bg-success { background-color: #22c55e; }
    .progress-bar.bg-warning { background-color: #f59e0b; }
  `],
})
export class AiResumeComponent implements OnInit {
  resumeText = '';
  jobTitle = '';
  companyName = '';
  jobDescription = '';
  charCount = 0;

  selectedAppId = '';
  applications: Application[] = [];
  selectedFile: File | null = null;
  fileError = '';

  analyzing = false;
  analyzed = false;
  result: ResumeAnalyzerResponse | null = null;

  constructor(
    private appService: ApplicationService,
    private aiService: AiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.appService.getAll().subscribe({
      next: (apps: Application[]) => { this.applications = apps; },
    });
  }

  onApplicationSelected() {
    if (this.selectedAppId) {
      const app = this.applications.find(a => a._id === this.selectedAppId);
      if (app) {
        this.jobTitle = app.jobTitle;
        this.companyName = app.companyName;
        this.jobDescription = app.notes || '';
      }
    }
  }

  onFileSelected(event: Event) {
    this.fileError = '';
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      return;
    }

    const file = input.files[0];
    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(file.type) && !file.name.toLowerCase().endsWith('.txt')) {
      this.fileError = 'Only PDF and TXT resumes are supported.';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;

    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.resumeText = reader.result?.toString() || '';
        this.updateCharCount();
      };
      reader.readAsText(file, 'utf-8');
    }
  }

  updateCharCount() {
    this.charCount = this.resumeText.length;
  }

  analyze() {
    if (!this.selectedFile && !this.resumeText.trim()) {
      return;
    }
    if (!this.jobTitle.trim() || !this.companyName.trim()) {
      return;
    }

    this.analyzing = true;
    this.analyzed = false;

    const request$ = this.selectedFile
      ? this.aiService.analyzeResumeFile(this.selectedFile, this.jobTitle, this.companyName, this.jobDescription)
      : this.aiService.analyzeResume(this.resumeText, this.jobTitle, this.companyName, this.jobDescription);

    request$.subscribe({
      next: (data) => {
        this.result = data;
        this.analyzed = true;
        this.analyzing = false;
      },
      error: () => {
        this.analyzing = false;
        alert('Analysis failed. Try again.');
      },
    });
  }

  scoreColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#ef4444';
    return '#dc2626';
  }

  gapSeverityBadge(severity: string): string {
    if (severity === 'high') return 'bg-danger';
    if (severity === 'medium') return 'bg-warning';
    return 'bg-info';
  }

  gapSeverityBg(severity: string): string {
    if (severity === 'high') return 'danger';
    if (severity === 'medium') return 'warning';
    return 'info';
  }
}
