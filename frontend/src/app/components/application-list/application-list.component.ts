import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApplicationService, Application } from '../../services/application.service';
import {
  APPLICATION_STATUSES,
  JOB_TYPES,
  statusBadgeClass,
} from '../../constants/application.constants';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 page-header">
        <h2 class="mb-0 page-title">
          <i class="bi bi-list-check me-2"></i>My Applications
        </h2>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn btn-outline-secondary btn-sm" (click)="exportCSV()">
            <i class="bi bi-filetype-csv me-1"></i>CSV
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm" (click)="exportPDF()">
            <i class="bi bi-file-earmark-pdf me-1"></i>PDF
          </button>
          <a routerLink="/applications/add" class="btn btn-primary">
            <i class="bi bi-plus-lg me-1"></i>Add Application
          </a>
        </div>
      </div>

      <div class="list-toolbar mb-3">
        <div class="row g-2 align-items-end">
          <div class="col-lg-4 col-md-6">
            <label class="form-label small text-muted mb-1">Search</label>
            <input
              type="search"
              class="form-control"
              placeholder="Job title or company…"
              [(ngModel)]="searchTerm"
              (ngModelChange)="applyFilter()"
            />
          </div>
          <div class="col-lg-2 col-md-3">
            <label class="form-label small text-muted mb-1">Status</label>
            <select class="form-select" [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()">
              <option [ngValue]="null">All statuses</option>
              @for (s of statuses; track s) {
                <option [ngValue]="s">{{ s }}</option>
              }
            </select>
          </div>
          <div class="col-lg-2 col-md-3">
            <label class="form-label small text-muted mb-1">Job type</label>
            <select class="form-select" [(ngModel)]="jobTypeFilter" (ngModelChange)="applyFilter()">
              <option [ngValue]="null">All types</option>
              @for (j of jobTypes; track j) {
                <option [ngValue]="j">{{ j }}</option>
              }
            </select>
          </div>
          <div class="col-lg-4 col-md-12">
            <label class="form-label small text-muted mb-1">Sort by</label>
            <select class="form-select" [(ngModel)]="sortBy" (ngModelChange)="applyFilter()">
              <option value="appliedDesc">Application date (newest)</option>
              <option value="appliedAsc">Application date (oldest)</option>
              <option value="updatedDesc">Recently updated</option>
              <option value="companyAsc">Company (A–Z)</option>
              <option value="titleAsc">Job title (A–Z)</option>
            </select>
          </div>
        </div>
        <div class="small text-muted mt-2 d-flex flex-wrap align-items-baseline gap-2">
          <span
            >Showing <strong>{{ filtered.length }}</strong> of {{ applications.length }} applications</span
          >
          @if (applications.length && statusBreakdown) {
            <span class="text-secondary">· {{ statusBreakdown }}</span>
          }
        </div>
        <p class="small text-muted mb-0 mt-1 fst-italic">
          Filters narrow this list. Each row’s badge is the status stored for that application (imports from email
          usually start as Applied unless the message looks like an interview or decision).
        </p>
      </div>

      @if (loading) {
        <div class="spinner-overlay">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      }

      @if (!loading && applications.length === 0) {
        <div class="text-center py-5 card card-glass p-5">
          <i class="bi bi-inbox display-1" style="color: var(--primary-light)"></i>
          <p class="text-muted mt-3 mb-0 fs-5">You haven’t added any applications yet.</p>
          <p class="text-muted small">Start your pipeline with the first role you apply to.</p>
          <a routerLink="/applications/add" class="btn btn-primary mt-2">
            <i class="bi bi-plus-lg me-1"></i>Add application
          </a>
        </div>
      }

      @if (!loading && applications.length > 0 && filtered.length === 0) {
        <div class="text-center py-5 card card-glass p-5">
          <i class="bi bi-funnel display-1" style="color: var(--primary-light)"></i>
          <p class="text-muted mt-3 mb-0 fs-5">No applications match these filters.</p>
          <p class="text-muted small">Clear search or change status / type to see more.</p>
          <button type="button" class="btn btn-outline-primary mt-2 me-2" (click)="clearFilters()">Clear filters</button>
          <a routerLink="/applications/add" class="btn btn-primary mt-2">
            <i class="bi bi-plus-lg me-1"></i>Add application
          </a>
        </div>
      }

      @if (!loading && filtered.length > 0) {
        <div class="card d-none d-md-block overflow-hidden">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>Job title</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Interview</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (app of filtered; track app._id) {
                  <tr>
                    <td class="fw-semibold">{{ app.jobTitle }}</td>
                    <td>{{ app.companyName }}</td>
                    <td><span class="badge bg-light text-dark border">{{ app.jobType }}</span></td>
                    <td><span [class]="'badge-status ' + statusBadgeClass(app.status)">{{ app.status }}</span></td>
                    <td>{{ app.applicationDate | date: 'mediumDate' }}</td>
                    <td>{{ app.interviewDate ? (app.interviewDate | date: 'mediumDate') : '—' }}</td>
                    <td class="text-end">
                      <div class="btn-group btn-group-sm">
                        <a [routerLink]="['/applications', app._id]" class="btn btn-outline-primary" title="View">
                          <i class="bi bi-eye"></i>
                        </a>
                        <a [routerLink]="['/applications/edit', app._id]" class="btn btn-outline-secondary" title="Edit">
                          <i class="bi bi-pencil"></i>
                        </a>
                        <button type="button" class="btn btn-outline-danger" (click)="deleteApp(app._id!)" title="Delete">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="d-md-none">
          @for (app of filtered; track app._id) {
            <div class="card mb-3 p-3">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <h6 class="mb-1 fw-bold">{{ app.jobTitle }}</h6>
                  <p class="mb-1 text-muted">{{ app.companyName }}</p>
                </div>
                <span [class]="'badge-status ' + statusBadgeClass(app.status)">{{ app.status }}</span>
              </div>
              <div class="d-flex flex-wrap gap-2 mt-2 text-muted small">
                <span><i class="bi bi-briefcase me-1"></i>{{ app.jobType }}</span>
                <span><i class="bi bi-geo-alt me-1"></i>{{ app.location || '—' }}</span>
                <span><i class="bi bi-calendar me-1"></i>{{ app.applicationDate | date: 'shortDate' }}</span>
              </div>
              <div class="d-flex gap-2 mt-3">
                <a [routerLink]="['/applications', app._id]" class="btn btn-outline-primary btn-sm flex-fill">View</a>
                <a [routerLink]="['/applications/edit', app._id]" class="btn btn-outline-secondary btn-sm flex-fill">Edit</a>
                <button type="button" class="btn btn-outline-danger btn-sm flex-fill" (click)="deleteApp(app._id!)">
                  Delete
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ApplicationListComponent implements OnInit {
  readonly statuses = APPLICATION_STATUSES;
  readonly jobTypes = JOB_TYPES;
  readonly statusBadgeClass = statusBadgeClass;

  applications: Application[] = [];
  filtered: Application[] = [];
  loading = true;
  searchTerm = '';
  /** null = “all” — use ngValue null so the filter is reliable in all browsers */
  statusFilter: string | null = null;
  jobTypeFilter: string | null = null;
  sortBy: 'appliedDesc' | 'appliedAsc' | 'updatedDesc' | 'companyAsc' | 'titleAsc' = 'appliedDesc';

  constructor(private appService: ApplicationService) {}

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loading = true;
    this.appService.getAll().subscribe({
      next: (data) => {
        this.applications = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = null;
    this.jobTypeFilter = null;
    this.applyFilter();
  }

  /** e.g. "Applied: 35 · Interview Scheduled: 3" — helps when everything looks “Applied” but data varies */
  get statusBreakdown(): string {
    const counts: Record<string, number> = {};
    for (const a of this.applications) {
      const s = a.status || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((x, y) => y[1] - x[1])
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  }

  applyFilter() {
    let result = [...this.applications];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.jobTitle.toLowerCase().includes(term) || a.companyName.toLowerCase().includes(term)
      );
    }
    if (this.statusFilter != null && this.statusFilter !== '') {
      result = result.filter((a) => a.status === this.statusFilter);
    }
    if (this.jobTypeFilter != null && this.jobTypeFilter !== '') {
      result = result.filter((a) => a.jobType === this.jobTypeFilter);
    }

    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'appliedAsc':
          return new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
        case 'appliedDesc':
          return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
        case 'updatedDesc':
          return (
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime()
          );
        case 'companyAsc':
          return a.companyName.localeCompare(b.companyName, undefined, { sensitivity: 'base' });
        case 'titleAsc':
          return a.jobTitle.localeCompare(b.jobTitle, undefined, { sensitivity: 'base' });
        default:
          return 0;
      }
    });

    this.filtered = result;
  }

  deleteApp(id: string) {
    if (!confirm('Delete this application?')) return;
    this.appService.delete(id).subscribe({
      next: () => this.loadApplications(),
    });
  }

  exportCSV() {
    const headers = [
      'Job Title',
      'Company',
      'Location',
      'Type',
      'Salary',
      'Status',
      'Applied',
      'Interview',
      'Link',
      'Notes',
    ];
    const rows = this.filtered.map((a) => [
      a.jobTitle,
      a.companyName,
      a.location,
      a.jobType,
      a.salary,
      a.status,
      a.applicationDate ? new Date(a.applicationDate).toLocaleDateString() : '',
      a.interviewDate ? new Date(a.interviewDate).toLocaleDateString() : '',
      a.jobLink,
      a.notes,
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job-applications.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPDF() {
    import('jspdf').then((jsPDFModule) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDFModule.default();
        doc.setFontSize(18);
        doc.text('Job applications', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 28);

        const headers = [['Job Title', 'Company', 'Type', 'Status', 'Applied']];
        const rows = this.filtered.map((a) => [
          a.jobTitle,
          a.companyName,
          a.jobType,
          a.status,
          a.applicationDate ? new Date(a.applicationDate).toLocaleDateString() : '',
        ]);

        (doc as unknown as { autoTable: (o: object) => void }).autoTable({
          head: headers,
          body: rows,
          startY: 35,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [79, 70, 229] },
        });

        doc.save('job-applications.pdf');
      });
    });
  }
}
