import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApplicationService, Application } from '../../services/application.service';
import { statusBadgeClass } from '../../constants/application.constants';

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
            <div class="card overflow-hidden">
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
                        <a [href]="app.jobLink" target="_blank" rel="noopener noreferrer" class="detail-value"
                          >Open listing</a
                        >
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
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .detail-item {
        display: flex;
        flex-direction: column;
      }
      .detail-label {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 600;
        margin-bottom: 4px;
      }
      .detail-value {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text);
      }
      .notes-box {
        background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid var(--border);
      }
    `,
  ],
})
export class ApplicationDetailComponent implements OnInit {
  readonly statusBadgeClass = statusBadgeClass;

  app: Application | null = null;
  loading = true;

  constructor(
    private appService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.appService.getById(id).subscribe({
        next: (data) => {
          this.app = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  deleteApp() {
    if (!this.app?._id) return;
    if (!confirm('Delete this application?')) return;
    this.appService.delete(this.app._id).subscribe({
      next: () => this.router.navigate(['/applications']),
    });
  }
}
