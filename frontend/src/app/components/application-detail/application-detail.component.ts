import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApplicationService, Application } from '../../services/application.service';
import { AiService, ResumeTipsResponse, InterviewQuestionsResponse } from '../../services/ai.service';
import { statusBadgeClass } from '../../constants/application.constants';

type AiTab = 'resume' | 'interview';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-4">
      @if (loading) {
        <div class="spinner-overlay">
          <div class="spinner-border text-primary"></div>
        </div>
      }

      @if (!loading && app) {
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <!-- Main card -->
            <div class="card overflow-hidden mb-4">
              <div class="detail-hero">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
                  <div>
                    <h3 class="mb-1 fw-bold" style="color: var(--text)">{{ app.jobTitle }}</h3>
                    <p class="text-muted mb-0 fs-5">{{ app.companyName }}</p>
                  </div>
                  <span [class]="'badge-status fs-6 ' + statusBadgeClass(app.status)">{{ app.status }}</span>
                </div>
              </div>

              <div class="p-4 pt-3">
                <div class="row g-3">
                  <div class="col-sm-6">
                    <div class="detail-item">
                      <span class="detail-label"><i class="bi bi-geo-alt me-1"></i>Location</span>
                      <span class="detail-value">{{ app.location || '—' }}</span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="detail-item">
                      <span class="detail-label"><i class="bi bi-briefcase me-1"></i>Job type</span>
                      <span class="detail-value">{{ app.jobType }}</span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="detail-item">
                      <span class="detail-label"><i class="bi bi-currency-dollar me-1"></i>Salary</span>
                      <span class="detail-value">{{ app.salary || '—' }}</span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="detail-item">
                      <span class="detail-label"><i class="bi bi-calendar-event me-1"></i>Applied</span>
                      <span class="detail-value">{{ app.applicationDate | date: 'longDate' }}</span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="detail-item">
                      <span class="detail-label"><i class="bi bi-calendar-check me-1"></i>Interview</span>
                      <span class="detail-value">{{
                        app.interviewDate ? (app.interviewDate | date: 'longDate') : 'Not scheduled'
                      }}</span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="detail-item">
                      <span class="detail-label"><i class="bi bi-link-45deg me-1"></i>Posting</span>
                      @if (app.jobLink) {
                        <a [href]="app.jobLink" target="_blank" rel="noopener noreferrer" class="detail-value">Open listing</a>
                      } @else {
                        <span class="detail-value">—</span>
                      }
                    </div>
                  </div>
                </div>

                @if (app.notes) {
                  <div class="mt-4">
                    <span class="detail-label"><i class="bi bi-sticky me-1"></i>Notes</span>
                    <p class="mt-2 mb-0 p-3 rounded notes-box">{{ app.notes }}</p>
                  </div>
                }

                <hr class="my-4" />

                <div class="d-flex gap-2 flex-wrap">
                  <a [routerLink]="['/applications/edit', app._id]" class="btn btn-primary">
                    <i class="bi bi-pencil me-1"></i>Edit
                  </a>
                  <button type="button" class="btn btn-outline-danger" (click)="deleteApp()">
                    <i class="bi bi-trash me-1"></i>Delete
                  </button>
                  <a routerLink="/applications" class="btn btn-outline-secondary ms-md-auto">
                    <i class="bi bi-arrow-left me-1"></i>Back to list
                  </a>
                </div>
              </div>
            </div>

            <!-- ─── AI Assistant Panel ──────────────────────────────────── -->
            <div class="card ai-panel overflow-hidden">
              <div class="ai-panel-header px-4 py-3 d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-2">
                  <span class="ai-icon"><i class="bi bi-stars"></i></span>
                  <div>
                    <h5 class="mb-0 fw-bold text-white">AI Assistant</h5>
                    <span class="small text-white opacity-75">Tailored for {{ app.jobTitle }} at {{ app.companyName }}</span>
                  </div>
                </div>
                @if (!aiLoaded) {
                  <button class="btn btn-light btn-sm fw-semibold" (click)="loadAi()" [disabled]="aiLoading">
                    @if (aiLoading) { <span class="spinner-border spinner-border-sm me-1"></span> Generating… }
                    @else { <i class="bi bi-magic me-1"></i> Generate AI Prep }
                  </button>
                }
              </div>

              @if (!aiLoaded && !aiLoading) {
                <div class="ai-empty px-4 py-5 text-center">
                  <i class="bi bi-robot fs-1 text-muted mb-3 d-block"></i>
                  <p class="text-muted mb-3">Get AI-powered resume tips and interview questions tailored to this specific role.</p>
                  <button class="btn btn-primary" (click)="loadAi()">
                    <i class="bi bi-magic me-1"></i> Generate AI Prep
                  </button>
                </div>
              }

              @if (aiLoading) {
                <div class="py-5 text-center">
                  <div class="spinner-border text-primary mb-3"></div>
                  <p class="text-muted">Generating personalized advice…</p>
                </div>
              }

              @if (aiLoaded && !aiLoading) {
                <!-- Tabs -->
                <div class="ai-tabs d-flex border-bottom">
                  <button
                    class="ai-tab flex-fill py-3"
                    [class.active]="activeTab === 'resume'"
                    (click)="activeTab = 'resume'"
                  >
                    <i class="bi bi-file-earmark-text me-2"></i>Resume Tips
                  </button>
                  <button
                    class="ai-tab flex-fill py-3"
                    [class.active]="activeTab === 'interview'"
                    (click)="activeTab = 'interview'"
                  >
                    <i class="bi bi-person-check me-2"></i>Interview Prep
                  </button>
                </div>

                <!-- Resume Tips tab -->
                @if (activeTab === 'resume' && resumeTips) {
                  <div class="p-4">
                    <p class="text-muted small mb-3">
                      <i class="bi bi-info-circle me-1"></i>
                      Tips tailored to the <strong>{{ app.jobTitle }}</strong> role at <strong>{{ app.companyName }}</strong>.
                    </p>
                    <div class="d-flex flex-column gap-3">
                      @for (tip of resumeTips.tips; track $index) {
                        <div class="ai-tip d-flex gap-3 align-items-start">
                          <span class="tip-num">{{ $index + 1 }}</span>
                          <p class="mb-0">{{ tip }}</p>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Interview Prep tab -->
                @if (activeTab === 'interview' && interviewQ) {
                  <div class="p-4">
                    <p class="text-muted small mb-3">
                      <i class="bi bi-info-circle me-1"></i>
                      Practice these out loud — use the STAR method for behavioral questions.
                    </p>

                    <!-- Behavioral -->
                    <div class="mb-4">
                      <h6 class="section-title mb-3">
                        <span class="section-pill bg-indigo">Behavioral</span>
                      </h6>
                      <div class="d-flex flex-column gap-2">
                        @for (q of interviewQ.behavioral; track $index) {
                          <div class="question-card d-flex gap-3 align-items-start">
                            <i class="bi bi-chat-quote-fill question-icon text-primary mt-1"></i>
                            <p class="mb-0">{{ q }}</p>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Technical -->
                    <div class="mb-4">
                      <h6 class="section-title mb-3">
                        <span class="section-pill bg-teal">Role-Specific</span>
                      </h6>
                      <div class="d-flex flex-column gap-2">
                        @for (q of interviewQ.technical; track $index) {
                          <div class="question-card d-flex gap-3 align-items-start">
                            <i class="bi bi-gear-fill question-icon text-teal mt-1"></i>
                            <p class="mb-0">{{ q }}</p>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Questions to ask -->
                    <div>
                      <h6 class="section-title mb-3">
                        <span class="section-pill bg-violet">Ask Them</span>
                      </h6>
                      <div class="d-flex flex-column gap-2">
                        @for (q of interviewQ.toAsk; track $index) {
                          <div class="question-card d-flex gap-3 align-items-start">
                            <i class="bi bi-patch-question-fill question-icon text-violet mt-1"></i>
                            <p class="mb-0">{{ q }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }

                <div class="px-4 pb-3">
                  <button class="btn btn-sm btn-outline-secondary" (click)="refreshAi()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Regenerate
                  </button>
                </div>
              }
            </div>
            <!-- End AI Panel -->

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-item { display: flex; flex-direction: column; }
    .detail-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; }
    .detail-value { font-size: 1rem; font-weight: 600; color: var(--text); }
    .notes-box { background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid var(--border); }

    /* AI Panel */
    .ai-panel { border: none; box-shadow: 0 4px 24px rgba(79,70,229,0.08); }
    .ai-panel-header { background: linear-gradient(135deg, #4f46e5 0%, #0891b2 60%, #db2777 100%); }
    .ai-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.1rem; }

    .ai-empty { background: #fafbff; }

    .ai-tabs { background: #f8fafc; }
    .ai-tab {
      background: none; border: none; font-weight: 600; font-size: 0.9rem;
      color: #64748b; cursor: pointer; transition: all 0.2s;
      border-bottom: 3px solid transparent;
    }
    .ai-tab.active { color: #4f46e5; border-bottom-color: #4f46e5; background: #fff; }
    .ai-tab:hover:not(.active) { background: #f1f5f9; }

    .tip-num {
      min-width: 28px; height: 28px; background: #eef2ff; color: #4f46e5;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; flex-shrink: 0;
    }
    .ai-tip { padding: 12px 16px; background: #fafbff; border: 1px solid #e8ecff; border-radius: 10px; }

    .question-card { padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .question-icon { font-size: 0.9rem; }

    .section-title { font-weight: 700; }
    .section-pill {
      display: inline-block; padding: 2px 12px; border-radius: 999px;
      font-size: 0.78rem; font-weight: 700; color: #fff;
    }
    .bg-indigo { background: #4f46e5; }
    .bg-teal { background: #0891b2; }
    .bg-violet { background: #7c3aed; }
    .text-teal { color: #0891b2; }
    .text-violet { color: #7c3aed; }
  `],
})
export class ApplicationDetailComponent implements OnInit {
  readonly statusBadgeClass = statusBadgeClass;

  app: Application | null = null;
  loading = true;

  // AI state
  aiLoading = false;
  aiLoaded = false;
  activeTab: AiTab = 'resume';
  resumeTips: ResumeTipsResponse | null = null;
  interviewQ: InterviewQuestionsResponse | null = null;

  constructor(
    private appService: ApplicationService,
    private aiService: AiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.appService.getById(id).subscribe({
        next: (data) => { this.app = data; this.loading = false; },
        error: () => { this.loading = false; },
      });
    }
  }

  loadAi() {
    if (!this.app) return;
    this.aiLoading = true;
    this.aiLoaded = false;

    let resumeDone = false;
    let interviewDone = false;

    const checkDone = () => {
      if (resumeDone && interviewDone) {
        this.aiLoading = false;
        this.aiLoaded = true;
      }
    };

    this.aiService.getResumeTips(this.app.jobTitle, this.app.companyName, this.app.notes).subscribe({
      next: (r) => { this.resumeTips = r; resumeDone = true; checkDone(); },
      error: () => { resumeDone = true; checkDone(); },
    });

    this.aiService.getInterviewQuestions(this.app.jobTitle, this.app.companyName, this.app.notes).subscribe({
      next: (r) => { this.interviewQ = r; interviewDone = true; checkDone(); },
      error: () => { interviewDone = true; checkDone(); },
    });
  }

  refreshAi() {
    this.aiLoaded = false;
    this.resumeTips = null;
    this.interviewQ = null;
    this.loadAi();
  }

  deleteApp() {
    if (!this.app?._id) return;
    if (!confirm('Delete this application?')) return;
    this.appService.delete(this.app._id).subscribe({
      next: () => this.router.navigate(['/applications']),
    });
  }
}
