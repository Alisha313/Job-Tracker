import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApplicationService, Application } from '../../services/application.service';
import { environment } from '../../../environments/environment';

interface AnalysisResult {
  overallScore: number;
  scoreLabel: string;
  summary: string;
  strengths: { title: string; detail: string }[];
  gaps: { title: string; detail: string; priority: string }[];
  keywordMatches: { matched: string[]; missing: string[] };
  suggestions: { section: string; action: string }[];
  atsScore: number;
  atsTips: string[];
}

@Component({
  selector: 'app-resume-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="resume-page container-fluid px-3 px-md-4 py-4">

      <!-- Header -->
      <header class="resume-hero">
        <div>
          <p class="text-uppercase small fw-bold mb-2" style="letter-spacing:0.1em;color:var(--primary)">AI-Powered</p>
          <h1 class="d-flex align-items-center gap-2 flex-wrap">
            <i class="bi bi-file-earmark-person d-none d-sm-inline" style="color:var(--primary)"></i>
            Resume Analyzer
          </h1>
          <p>Paste your resume and enter a job posting URL — get an instant score, keyword gaps, and tailored suggestions.</p>
        </div>
        <a routerLink="/applications" class="btn btn-outline-primary">
          <i class="bi bi-arrow-left me-1"></i>Back to Applications
        </a>
      </header>

      <div class="row g-4">

        <!-- ── Left: Input Panel ── -->
        <div class="col-xl-5 col-lg-6">
          <div class="resume-input-card card p-4">

            <!-- Resume Upload -->
            <div class="mb-4">
              <label class="resume-section-label">
                <i class="bi bi-upload me-1"></i> Upload Resume (PDF / DOCX)
              </label>
              <div
                class="resume-drop-zone"
                [class.has-file]="uploadedFileName"
                (dragover)="$event.preventDefault()"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
              >
                <input
                  #fileInput
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  class="d-none"
                  (change)="onFileChange($event)"
                />
                <ng-container *ngIf="!uploadedFileName; else fileSelected">
                  <div class="text-center py-2">
                    <i class="bi bi-cloud-arrow-up-fill drop-icon"></i>
                    <p class="mb-0 fw-semibold">Drop file here or click to browse</p>
                    <p class="small text-muted mb-0">.pdf, .docx, .txt</p>
                  </div>
                </ng-container>
                <ng-template #fileSelected>
                  <div class="d-flex align-items-center gap-3 px-1">
                    <i class="bi bi-file-earmark-check-fill text-success fs-4"></i>
                    <div class="flex-grow-1 min-w-0">
                      <p class="mb-0 fw-semibold text-truncate">{{ uploadedFileName }}</p>
                      <p class="small text-muted mb-0">Click to replace</p>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger" (click)="clearFile($event)">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                </ng-template>
              </div>
            </div>

            <!-- Resume Text (always shown as the editable source) -->
            <div class="mb-4">
              <label class="resume-section-label">
                <i class="bi bi-card-text me-1"></i> Resume Content
                <span class="text-muted fw-normal ms-1">(paste or edit)</span>
              </label>
              <textarea
                class="form-control resume-textarea"
                placeholder="Paste your entire resume text here — or upload a file above and it will appear here automatically..."
                [(ngModel)]="resumeText"
                rows="12"
              ></textarea>
              <p class="text-muted small mt-1 mb-0">{{ resumeText.length }} characters</p>
            </div>

            <!-- Target Job -->
            <div class="mb-3">
              <label class="resume-section-label">
                <i class="bi bi-briefcase me-1"></i> Target Job
              </label>
              <div class="row g-2 mb-2">
                <div class="col-7">
                  <select class="form-select" [(ngModel)]="selectedJobId" (change)="onJobSelect()">
                    <option value="">— Pick from your applications —</option>
                    <option *ngFor="let app of applications" [value]="app._id">{{ app.jobTitle }} @ {{ app.companyName }}</option>
                  </select>
                </div>
                <div class="col-5">
                  <input type="text" class="form-control" placeholder="Company" [(ngModel)]="companyName" />
                </div>
              </div>
              <input type="text" class="form-control" placeholder="Job Title *" [(ngModel)]="jobTitle" required />
            </div>

            <!-- Job Description URL -->
            <div class="mb-4">
              <label class="resume-section-label">
                <i class="bi bi-link-45deg me-1"></i> Job Posting URL
                <span class="text-muted fw-normal ms-1">(optional but recommended)</span>
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">
                  <i class="bi bi-globe2 text-primary"></i>
                </span>
                <input
                  type="url"
                  class="form-control border-start-0 ps-0"
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  [(ngModel)]="jobDescriptionUrl"
                />
              </div>
              <p *ngIf="jobDescriptionUrl && !isValidUrl(jobDescriptionUrl)" class="text-danger small mt-1 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>Enter a valid URL starting with https://
              </p>
              <p class="text-muted small mt-1 mb-0">
                <i class="bi bi-info-circle me-1"></i>
                Paste a public job listing URL — we'll fetch the description automatically for accurate keyword matching.
              </p>
            </div>

            <!-- Analyze Button -->
            <button
              type="button"
              class="btn btn-primary w-100 btn-analyze"
              (click)="analyze()"
              [disabled]="loading || !resumeText.trim() || !jobTitle.trim()"
            >
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
              <span *ngIf="loading">Analyzing with Claude AI…</span>
              <ng-container *ngIf="!loading">
                <i class="bi bi-magic me-2"></i>Analyze Resume
              </ng-container>
            </button>

            <div *ngIf="error" class="alert alert-danger mt-3 mb-0 py-2">
              <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
            </div>
          </div>
        </div>

        <!-- ── Right: Results Panel ── -->
        <div class="col-xl-7 col-lg-6">
          <div *ngIf="!analysis && !loading" class="resume-empty-state card h-100 d-flex align-items-center justify-content-center text-center p-5">
            <div class="empty-icon-wrap mb-4">
              <i class="bi bi-file-earmark-person"></i>
            </div>
            <h2 class="h4 fw-bold">No Analysis Yet</h2>
            <p class="text-muted mb-0" style="max-width:26rem">
              Paste your resume, enter your target job title, and optionally paste a job posting URL for the most accurate analysis.
            </p>
            <div class="resume-tips mt-4">
              <div class="tip"><i class="bi bi-1-circle-fill text-primary"></i><span>Upload or paste your resume</span></div>
              <div class="tip"><i class="bi bi-2-circle-fill text-primary"></i><span>Select a job from your pipeline or type a title</span></div>
              <div class="tip"><i class="bi bi-3-circle-fill text-primary"></i><span>Paste the job posting URL for keyword matching</span></div>
              <div class="tip"><i class="bi bi-4-circle-fill text-primary"></i><span>Click Analyze for your instant AI score</span></div>
            </div>
          </div>

          <div *ngIf="loading" class="resume-empty-state card h-100 d-flex align-items-center justify-content-center text-center p-5">
            <div class="loading-pulse mb-4">
              <i class="bi bi-magic text-primary" style="font-size:3rem"></i>
            </div>
            <h2 class="h5 fw-bold">Analyzing your resume…</h2>
            <p class="text-muted">
              {{ jobDescriptionUrl ? 'Fetching job posting and running AI analysis.' : 'Running AI analysis.' }}
              This takes a few seconds.
            </p>
            <div class="progress mt-3" style="width:200px;height:6px">
              <div class="progress-bar progress-bar-striped progress-bar-animated" style="width:100%"></div>
            </div>
          </div>

          <div *ngIf="analysis && !loading" class="resume-results">

              <!-- Score Header -->
              <div class="score-header card mb-4 p-4">
                <div class="d-flex align-items-center gap-4 flex-wrap">
                  <div class="score-ring" [class]="'score-' + getScoreClass(analysis.overallScore)">
                    <svg viewBox="0 0 120 120" class="score-svg">
                      <circle cx="60" cy="60" r="52" class="score-bg-ring" />
                      <circle
                        cx="60" cy="60" r="52"
                        class="score-fill-ring"
                        [style.strokeDashoffset]="getScoreDash(analysis.overallScore)"
                      />
                    </svg>
                    <div class="score-text">
                      <span class="score-num">{{ analysis.overallScore }}</span>
                      <span class="score-denom">/100</span>
                    </div>
                  </div>
                  <div>
                    <p class="text-uppercase small fw-bold mb-1" style="letter-spacing:0.1em;color:var(--text-muted)">Overall Score</p>
                    <h2 class="h3 fw-black mb-1" [class]="'text-score-' + getScoreClass(analysis.overallScore)">
                      {{ analysis.scoreLabel }}
                    </h2>
                    <p class="text-muted mb-2" style="max-width:36rem">{{ analysis.summary }}</p>
                    <span *ngIf="jobDescriptionFetched" class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
                      <i class="bi bi-check-circle me-1"></i>Job description fetched & matched
                    </span>
                    <span *ngIf="!jobDescriptionFetched" class="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2">
                      <i class="bi bi-info-circle me-1"></i>No URL — analysis based on job title only
                    </span>
                  </div>
                </div>
              </div>

              <!-- ATS Score -->
              <div class="card mb-4 p-4">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <h3 class="h6 fw-bold text-uppercase mb-1" style="letter-spacing:0.08em;color:var(--text-muted)">
                      <i class="bi bi-robot me-1 text-primary"></i>ATS Compatibility
                    </h3>
                    <p class="mb-0 text-muted small">How well your resume passes automated screening systems</p>
                  </div>
                  <div class="d-flex align-items-center gap-3">
                    <div class="ats-bar-wrap">
                      <div class="ats-bar" [style.width.%]="analysis.atsScore" [class]="'ats-' + getScoreClass(analysis.atsScore)"></div>
                    </div>
                    <span class="fw-black fs-5" [class]="'text-score-' + getScoreClass(analysis.atsScore)">{{ analysis.atsScore }}%</span>
                  </div>
                </div>
                <ul *ngIf="analysis.atsTips?.length" class="ats-tips mt-3 mb-0">
                  <li *ngFor="let tip of analysis.atsTips"><i class="bi bi-lightbulb-fill text-amber me-2"></i>{{ tip }}</li>
                </ul>
              </div>

              <!-- Keyword Matching -->
              <div class="card mb-4 p-4">
                <h3 class="result-section-title">
                  <i class="bi bi-tags-fill me-2"></i>Keyword Matching
                </h3>
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="keyword-box matched">
                      <p class="keyword-box-label"><i class="bi bi-check-circle-fill me-1"></i>Matched ({{ analysis.keywordMatches.matched?.length || 0 }})</p>
                      <div class="keyword-chips">
                        <span *ngFor="let kw of analysis.keywordMatches.matched" class="chip chip-matched">{{ kw }}</span>
                        <span *ngIf="!analysis.keywordMatches.matched?.length" class="text-muted small">None found</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="keyword-box missing">
                      <p class="keyword-box-label"><i class="bi bi-x-circle-fill me-1"></i>Missing ({{ analysis.keywordMatches.missing?.length || 0 }})</p>
                      <div class="keyword-chips">
                        <span *ngFor="let kw of analysis.keywordMatches.missing" class="chip chip-missing">{{ kw }}</span>
                        <span *ngIf="!analysis.keywordMatches.missing?.length" class="text-muted small">Great — no critical gaps!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Strengths & Gaps -->
              <div class="row g-4 mb-4">
                <div class="col-md-6">
                  <div class="card p-4 h-100">
                    <h3 class="result-section-title text-success">
                      <i class="bi bi-hand-thumbs-up-fill me-2"></i>Strengths
                    </h3>
                    <div *ngFor="let s of analysis.strengths" class="strength-item">
                      <p class="fw-semibold mb-1">{{ s.title }}</p>
                      <p class="text-muted small mb-0">{{ s.detail }}</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card p-4 h-100">
                    <h3 class="result-section-title text-danger">
                      <i class="bi bi-exclamation-triangle-fill me-2"></i>Gaps
                    </h3>
                    <div *ngFor="let g of analysis.gaps" class="gap-item">
                      <div class="d-flex align-items-start justify-content-between gap-2 mb-1">
                        <p class="fw-semibold mb-0">{{ g.title }}</p>
                        <span [class]="'priority-badge priority-' + g.priority.toLowerCase()">{{ g.priority }}</span>
                      </div>
                      <p class="text-muted small mb-0">{{ g.detail }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Suggestions -->
              <div class="card p-4 mb-4">
                <h3 class="result-section-title">
                  <i class="bi bi-pencil-fill me-2 text-primary"></i>Rewrite Suggestions
                </h3>
                <div *ngFor="let s of analysis.suggestions" class="suggestion-item">
                  <p class="suggestion-section">{{ s.section }}</p>
                  <p class="text-muted small mb-0">{{ s.action }}</p>
                </div>
              </div>

              <!-- Re-analyze button -->
              <button type="button" class="btn btn-outline-primary w-100" (click)="analysis = null">
                <i class="bi bi-arrow-counterclockwise me-2"></i>Start New Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
  styles: [
    `
    .resume-hero {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #eef2ff 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.35rem 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow);
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }
    .resume-hero h1 {
      font-size: clamp(1.5rem, 3.5vw, 2rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 0 0 0.35rem;
      background: linear-gradient(135deg, var(--primary) 0%, var(--violet) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .resume-hero p { margin: 0; color: var(--text-muted); font-size: 1.05rem; max-width: 36rem; }

    .resume-input-card { border: 1px solid var(--border); box-shadow: var(--shadow); }

    .resume-section-label {
      display: block;
      font-weight: 700;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .resume-drop-zone {
      border: 2px dashed #c7d2fe;
      border-radius: var(--radius-sm);
      padding: 1.25rem;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
      background: #f8faff;
    }
    .resume-drop-zone:hover, .resume-drop-zone.has-file { border-color: var(--primary); background: #eef2ff; }
    .drop-icon { font-size: 2rem; color: var(--primary-light); display: block; margin-bottom: 0.5rem; }

    .resume-textarea {
      font-size: 0.9rem;
      font-family: 'Courier New', monospace;
      background: #f8faff;
      border-radius: var(--radius-sm);
      resize: vertical;
    }

    .btn-analyze {
      font-size: 1.05rem;
      font-weight: 700;
      padding: 0.85rem;
      letter-spacing: 0.02em;
    }

    .resume-empty-state {
      border: 2px dashed #e2e8f0 !important;
      background: linear-gradient(180deg, #fff 0%, #f8faff 100%) !important;
      border-radius: var(--radius) !important;
      min-height: 400px;
    }
    .resume-empty-state:hover { transform: none; }
    .empty-icon-wrap i { font-size: 4rem; color: #c7d2fe; }
    .resume-tips { text-align: left; display: flex; flex-direction: column; gap: 0.75rem; }
    .tip { display: flex; align-items: center; gap: 0.75rem; font-size: 0.95rem; color: var(--text-muted); }
    .tip i { font-size: 1.1rem; flex-shrink: 0; }

    @keyframes pulse-scale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
    .loading-pulse { animation: pulse-scale 2s ease-in-out infinite; }

    .score-header { border: 1px solid var(--border); background: linear-gradient(135deg, #fff 0%, #f8faff 100%); }
    .score-ring { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
    .score-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .score-bg-ring { fill: none; stroke: #e2e8f0; stroke-width: 10; }
    .score-fill-ring {
      fill: none; stroke-width: 10;
      stroke-dasharray: 326.7;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s ease;
    }
    .score-good .score-fill-ring { stroke: var(--success); }
    .score-fair .score-fill-ring { stroke: var(--amber); }
    .score-weak .score-fill-ring { stroke: var(--danger); }
    .score-excellent .score-fill-ring { stroke: #0891b2; }
    .score-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score-num { font-size: 1.75rem; font-weight: 900; line-height: 1; }
    .score-denom { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
    .text-score-good { color: var(--success) !important; }
    .text-score-fair { color: var(--amber) !important; }
    .text-score-weak { color: var(--danger) !important; }
    .text-score-excellent { color: #0891b2 !important; }

    .ats-bar-wrap { width: 160px; height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .ats-bar { height: 100%; border-radius: 999px; transition: width 1s ease; }
    .ats-good { background: var(--success); }
    .ats-fair { background: var(--amber); }
    .ats-weak { background: var(--danger); }
    .ats-excellent { background: #0891b2; }
    .ats-tips { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .ats-tips li { font-size: 0.9rem; color: var(--text-muted); }

    .keyword-box { border-radius: var(--radius-sm); padding: 1rem; height: 100%; }
    .keyword-box.matched { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .keyword-box.missing { background: #fef2f2; border: 1px solid #fecaca; }
    .keyword-box-label { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.75rem; }
    .matched .keyword-box-label { color: #15803d; }
    .missing .keyword-box-label { color: #dc2626; }
    .keyword-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .chip { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .chip-matched { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .chip-missing { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

    .result-section-title { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; color: var(--text-muted); }
    .strength-item, .gap-item { padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
    .strength-item:last-child, .gap-item:last-child { border-bottom: none; padding-bottom: 0; }
    .priority-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 0.15rem 0.5rem; border-radius: 999px; flex-shrink: 0; }
    .priority-high { background: #fee2e2; color: #dc2626; }
    .priority-medium { background: #fef3c7; color: #d97706; }
    .priority-low { background: #f0fdf4; color: #15803d; }

    .suggestion-item { padding: 0.75rem; background: #f8faff; border-radius: 10px; border-left: 3px solid var(--primary-light); margin-bottom: 0.75rem; }
    .suggestion-item:last-child { margin-bottom: 0; }
    .suggestion-section { font-weight: 700; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--primary); margin-bottom: 0.3rem; }
  `],
})
export class ResumeAnalyzerComponent implements OnInit {
  applications: Application[] = [];
  resumeText = '';
  jobTitle = '';
  companyName = '';
  selectedJobId = '';
  jobDescriptionUrl = '';
  uploadedFileName = '';

  loading = false;
  error = '';
  analysis: AnalysisResult | null = null;
  jobDescriptionFetched = false;

  constructor(
    private http: HttpClient,
    private appService: ApplicationService
  ) {}

  ngOnInit() {
    this.appService.getAll().subscribe({ next: (apps) => (this.applications = apps) });
  }

  onJobSelect() {
    const app = this.applications.find((a) => a._id === this.selectedJobId);
    if (app) {
      this.jobTitle = app.jobTitle;
      this.companyName = app.companyName;
      if (app.jobLink && this.isValidUrl(app.jobLink)) {
        this.jobDescriptionUrl = app.jobLink;
      }
    }
  }

  isValidUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
      return false;
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadedFileName = file.name;
    this.readFileAsText(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.uploadedFileName = file.name;
    this.readFileAsText(file);
  }

  readFileAsText(file: File) {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
      // Use PDF.js (loaded via CDN in index.html) to extract text from PDF
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          // @ts-ignore — PDF.js exposes itself as window.pdfjsLib when loaded via CDN script tag
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            this.error = 'PDF parser not available. Please paste your resume text manually.';
            return;
          }
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          this.resumeText = fullText.trim();
          if (!this.resumeText) {
            this.error = 'Could not extract text from this PDF (it may be scanned/image-based). Please paste your resume text manually.';
          }
        } catch (err) {
          console.error('PDF parse error:', err);
          this.error = 'Failed to read PDF. Please paste your resume text manually.';
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // .txt, .doc, .docx — read as plain text
      const reader = new FileReader();
      reader.onload = (e) => {
        this.resumeText = (e.target?.result as string) || '';
      };
      reader.readAsText(file);
    }
  }

  clearFile(event: Event) {
    event.stopPropagation();
    this.uploadedFileName = '';
    this.resumeText = '';
  }

  async analyze() {
    this.error = '';
    this.analysis = null;

    if (!this.resumeText.trim() || this.resumeText.length < 50) {
      this.error = 'Please add your resume content — paste text or upload a file.';
      return;
    }
    if (!this.jobTitle.trim()) {
      this.error = 'Job title is required.';
      return;
    }
    if (this.jobDescriptionUrl && !this.isValidUrl(this.jobDescriptionUrl)) {
      this.error = 'Please enter a valid URL starting with https://';
      return;
    }

    this.loading = true;

    const token = localStorage.getItem('token');

    this.http.post<{ analysis: AnalysisResult; jobDescriptionFetched: boolean }>(
      `${environment.apiBase}/resume/analyze`,
      {
        resumeText: this.resumeText,
        jobTitle: this.jobTitle,
        companyName: this.companyName,
        jobDescriptionUrl: this.jobDescriptionUrl,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (res) => {
        this.analysis = res.analysis;
        this.jobDescriptionFetched = res.jobDescriptionFetched;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Analysis failed. Please try again.';
        this.loading = false;
      },
    });
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'weak';
  }

  getScoreDash(score: number): number {
    const circumference = 326.7;
    return circumference - (score / 100) * circumference;
  }
}