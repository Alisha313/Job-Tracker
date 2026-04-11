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
    <div class="applications-page container-fluid px-3 px-md-4 py-4">
      <header class="app-list-hero">
        <div>
          <p class="text-uppercase small fw-bold mb-2" style="letter-spacing:0.1em;color:var(--primary)">Pipeline</p>
          <h1 class="d-flex align-items-center gap-2 flex-wrap">
            <i class="bi bi-kanban d-none d-sm-inline" style="color:var(--primary)"></i>
            Applications
          </h1>
          <p>Search, filter, and manage every role — synced fields match what you see on the dashboard.</p>
        </div>
        <div class="app-list-actions">
          <div class="btn-group" role="group" aria-label="Export">
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="exportCSV()">
              <i class="bi bi-filetype-csv me-1"></i>CSV
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="exportPDF()">
              <i class="bi bi-file-earmark-pdf me-1"></i>PDF
            </button>
          </div>
          <a routerLink="/applications/add" class="btn btn-primary">
            <i class="bi bi-plus-lg me-1"></i>Add application
          </a>
        </div>
      </header>

      <section class="app-filters-panel">
        <div class="row g-3 align-items-end">
          <div class="col-lg-4 col-md-6">
            <label class="form-label mb-1"><i class="bi bi-search me-1"></i>Search</label>
            <input
              type="search"
              class="form-control"
              placeholder="Job title or company…"
              [(ngModel)]="searchTerm"
              (ngModelChange)="applyFilter()"
            />
          </div>
          <div class="col-lg-2 col-md-3">
            <label class="form-label mb-1"><i class="bi bi-funnel me-1"></i>Status</label>
            <select class="form-select" [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()">
              <option [ngValue]="null">All statuses</option>
              @for (s of statuses; track s) {
                <option [ngValue]="s">{{ s }}</option>
              }
            </select>
          </div>
          <div class="col-lg-2 col-md-3">
            <label class="form-label mb-1"><i class="bi bi-briefcase me-1"></i>Job type</label>
            <select class="form-select" [(ngModel)]="jobTypeFilter" (ngModelChange)="applyFilter()">
              <option [ngValue]="null">All types</option>
              @for (j of jobTypes; track j) {
                <option [ngValue]="j">{{ j }}</option>
              }
            </select>
          </div>
          <div class="col-lg-4 col-md-12">
            <label class="form-label mb-1"><i class="bi bi-sort-down me-1"></i>Sort</label>
            <select class="form-select" [(ngModel)]="sortBy" (ngModelChange)="applyFilter()">
              <option value="appliedDesc">Application date (newest)</option>
              <option value="appliedAsc">Application date (oldest)</option>
              <option value="updatedDesc">Recently updated</option>
              <option value="companyAsc">Company (A–Z)</option>
              <option value="titleAsc">Job title (A–Z)</option>
            </select>
          </div>
        </div>
        <div class="app-filters-meta text-muted d-flex flex-wrap align-items-baseline gap-2">
          <span
            >Showing <strong class="text-dark">{{ filtered.length }}</strong> of
            <strong class="text-dark">{{ applications.length }}</strong> applications</span
          >
          @if (applications.length && statusBreakdown) {
            <span class="d-none d-md-inline">·</span>
            <span class="small">{{ statusBreakdown }}</span>
          }
        </div>
        <p class="app-filters-hint mb-0">
          <i class="bi bi-info-circle me-1 text-primary"></i>
          Filters only affect this list. Email imports often stay <strong>Applied</strong> unless the message looks like
          an interview, offer, or decision.
        </p>
      </section>

      @if (loading) {
        <div class="spinner-overlay py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      }

      @if (!loading && applications.length === 0) {
        <div class="text-center py-5 px-3 card app-empty-state">
          <div class="rounded-4 d-inline-flex align-items-center justify-content-center mb-3" style="width:88px;height:88px;background:linear-gradient(145deg,#eef2ff,#e0e7ff)">
            <i class="bi bi-inbox" style="font-size:2.5rem;color:var(--primary)"></i>
          </div>
          <h2 class="h4 fw-bold">No applications yet</h2>
          <p class="text-muted mb-1">Your pipeline starts with the first role you track.</p>
          <a routerLink="/applications/add" class="btn btn-primary mt-3 px-4">
            <i class="bi bi-plus-lg me-1"></i>Add application
          </a>
        </div>
      }

      @if (!loading && applications.length > 0 && filtered.length === 0) {
        <div class="text-center py-5 px-3 card app-empty-state">
          <div class="rounded-4 d-inline-flex align-items-center justify-content-center mb-3" style="width:88px;height:88px;background:linear-gradient(145deg,#fff7ed,#ffedd5)">
            <i class="bi bi-funnel" style="font-size:2.5rem;color:#c2410c"></i>
          </div>
          <h2 class="h4 fw-bold">No matches</h2>
          <p class="text-muted mb-3">Try clearing filters or broadening search.</p>
          <button type="button" class="btn btn-outline-primary me-2" (click)="clearFilters()">Clear filters</button>
          <a routerLink="/applications/add" class="btn btn-primary">
            <i class="bi bi-plus-lg me-1"></i>Add application
          </a>
        </div>
      }

      @if (!loading && filtered.length > 0) {
        <div class="app-table-card d-none d-md-block">
          <div class="table-responsive">
            <table class="table app-table mb-0 align-middle">
              <thead>
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
                    <td>
                      <a [routerLink]="['/applications', app._id]" class="job-title-link">{{ app.jobTitle }}</a>
                    </td>
                    <td class="company-cell">{{ app.companyName }}</td>
                    <td><span class="type-pill">{{ app.jobType }}</span></td>
                    <td><span [class]="'badge-status ' + statusBadgeClass(app.status)">{{ app.status }}</span></td>
                    <td class="text-nowrap">{{ app.applicationDate | date: 'mediumDate' }}</td>
                    <td class="text-nowrap text-muted">{{ app.interviewDate ? (app.interviewDate | date: 'mediumDate') : '—' }}</td>
                    <td class="text-end">
                      <div class="app-table-actions">
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
            <div class="card app-mobile-card mb-3">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div class="flex-grow-1 min-w-0">
                  <h2 class="app-mc-title">
                    <a [routerLink]="['/applications', app._id]">{{ app.jobTitle }}</a>
                  </h2>
                  <p class="mb-0 text-muted small">{{ app.companyName }}</p>
                </div>
                <span [class]="'badge-status ' + statusBadgeClass(app.status)" style="flex-shrink:0">{{ app.status }}</span>
              </div>
              <div class="app-mobile-meta">
                <span><i class="bi bi-briefcase me-1 text-primary"></i>{{ app.jobType }}</span>
                <span><i class="bi bi-geo-alt me-1 text-primary"></i>{{ app.location || '—' }}</span>
                <span><i class="bi bi-calendar me-1 text-primary"></i>{{ app.applicationDate | date: 'shortDate' }}</span>
                @if (app.interviewDate) {
                  <span><i class="bi bi-calendar-event me-1 text-success"></i>{{ app.interviewDate | date: 'shortDate' }}</span>
                }
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
