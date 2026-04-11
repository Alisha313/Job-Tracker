import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ApplicationService, Stats } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';
import { statusBadgeClass } from '../../constants/application.constants';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  template: `
    <div class="dashboard-shell container-fluid px-3 px-md-4 py-4">
      <header class="dash-top mb-4">
        <div class="dash-top-inner">
          <div>
            <p class="dash-eyebrow mb-1">Overview</p>
            <h1 class="dash-heading mb-1">Dashboard</h1>
            <p class="text-muted mb-0">Status mix, roles, interviews, and latest updates.</p>
          </div>
          <div class="dash-top-actions">
            <a routerLink="/applications/add" class="btn btn-primary">
              <i class="bi bi-plus-lg me-1"></i>Add application
            </a>
            <a routerLink="/applications" class="btn btn-outline-secondary">View all</a>
            <div class="dash-user-pill">
              <span class="dash-avatar">{{ (auth.getUser()?.name || '?').charAt(0) }}</span>
              <span class="fw-semibold">{{ auth.getUser()?.name || 'there' }}</span>
            </div>
          </div>
        </div>
      </header>

      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="text-muted mt-2 mb-0">Loading…</p>
        </div>
      }

      @if (!loading) {
        <div class="row g-3 g-lg-4 mb-4">
          <div class="col-6 col-xl-3">
            <div class="stat-card stat-total card p-3 p-lg-4 h-100">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <p class="text-muted small fw-semibold mb-1">Total</p>
                  <h2 class="mb-0 fw-bold" style="color:var(--primary)">{{ stats?.total || 0 }}</h2>
                </div>
                <i class="bi bi-briefcase-fill fs-3 opacity-75" style="color:var(--primary)"></i>
              </div>
            </div>
          </div>
          <div class="col-6 col-xl-3">
            <div class="stat-card stat-review card p-3 p-lg-4 h-100">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <p class="text-muted small fw-semibold mb-1">Under review</p>
                  <h2 class="mb-0 fw-bold" style="color:#d97706">{{ stats?.statusCounts?.['Under Review'] || 0 }}</h2>
                </div>
                <i class="bi bi-hourglass-split fs-3 opacity-75" style="color:#d97706"></i>
              </div>
            </div>
          </div>
          <div class="col-6 col-xl-3">
            <div class="stat-card stat-interview card p-3 p-lg-4 h-100">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <p class="text-muted small fw-semibold mb-1">Interviews</p>
                  <h2 class="mb-0 fw-bold" style="color:#059669">{{ stats?.statusCounts?.['Interview Scheduled'] || 0 }}</h2>
                </div>
                <i class="bi bi-calendar-event fs-3 opacity-75" style="color:#059669"></i>
              </div>
            </div>
          </div>
          <div class="col-6 col-xl-3">
            <div class="stat-card stat-offer card p-3 p-lg-4 h-100">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <p class="text-muted small fw-semibold mb-1">Offers</p>
                  <h2 class="mb-0 fw-bold" style="color:#7c3aed">{{ stats?.statusCounts?.['Offer Received'] || 0 }}</h2>
                </div>
                <i class="bi bi-trophy-fill fs-3 opacity-75" style="color:#7c3aed"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-12 col-xl-7">
            <div class="card chart-card h-100 p-3 p-lg-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <span class="dash-card-icon"><i class="bi bi-pie-chart-fill"></i></span>
                <div>
                  <h2 class="h5 mb-0 fw-bold">By status</h2>
                  <p class="small text-muted mb-0">Share of your pipeline</p>
                </div>
              </div>
              <div class="chart-canvas-wrap">
                @if (pieChartData.labels!.length > 0) {
                  <canvas baseChart [data]="pieChartData" [options]="pieChartOptions" type="pie"></canvas>
                } @else {
                  <p class="text-muted text-center py-5 mb-0">No applications yet.</p>
                }
              </div>
            </div>
          </div>
          <div class="col-12 col-xl-5">
            <div class="card chart-card h-100 p-3 p-lg-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <span class="dash-card-icon"><i class="bi bi-bar-chart-fill"></i></span>
                <div>
                  <h2 class="h5 mb-0 fw-bold">By job type</h2>
                  <p class="small text-muted mb-0">Full-time, remote, and more</p>
                </div>
              </div>
              <div class="chart-canvas-wrap chart-canvas-wrap-bar">
                @if (barChartData.labels!.length > 0) {
                  <canvas baseChart [data]="barChartData" [options]="barChartOptions" type="bar"></canvas>
                } @else {
                  <p class="text-muted text-center py-5 mb-0">No applications yet.</p>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-12 col-lg-5 col-xl-4">
            <div class="card h-100 p-3 p-lg-4 border-0 shadow-sm dash-side-card">
              <div class="d-flex align-items-center gap-2 mb-3">
                <span class="dash-card-icon"><i class="bi bi-calendar-heart"></i></span>
                <div>
                  <h2 class="h5 mb-0 fw-bold">Interviews</h2>
                  <p class="small text-muted mb-0">Upcoming, past dates, or TBD</p>
                </div>
              </div>
              @if (stats?.interviewSpotlight?.length) {
                <div class="interview-list">
                  @for (row of stats!.interviewSpotlight!; track row.id) {
                    <div class="interview-row" [class.interview-row-past]="row.bucket === 'past'">
                      <span class="badge rounded-pill mb-2" [ngClass]="spotlightBadge(row.bucket)">{{ spotlightLabel(row.bucket) }}</span>
                      <p class="fw-semibold mb-1">{{ row.jobTitle }}</p>
                      <p class="small text-muted mb-1">{{ row.companyName }}</p>
                      @if (row.interviewDate) {
                        <p class="small mb-0 text-secondary">{{ row.interviewDate | date:'MMM d, y' }}</p>
                      } @else {
                        <p class="small mb-0 fst-italic text-muted">Add a date on the application</p>
                      }
                    </div>
                  }
                </div>
              } @else {
                <p class="text-muted small mb-0">
                  Nothing in <strong>Interview Scheduled</strong> yet. Mark an application or let Gmail sync pick up interview keywords.
                </p>
              }
            </div>
          </div>
          <div class="col-12 col-lg-7 col-xl-8">
            <div class="card h-100 p-3 p-lg-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <span class="dash-card-icon"><i class="bi bi-clock-history"></i></span>
                <div>
                  <h2 class="h5 mb-0 fw-bold">Recent activity</h2>
                  <p class="small text-muted mb-0">Newest updates first</p>
                </div>
              </div>
              @if (stats?.recentActivity?.length) {
                <div class="timeline">
                  @for (item of stats!.recentActivity; track item.id) {
                    <div class="timeline-item">
                      <div class="timeline-dot" [class]="'dot-' + getStatusColor(item.status)"></div>
                      <div class="timeline-content">
                        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                          <div>
                            <h3 class="h6 mb-0">{{ item.jobTitle }}</h3>
                            <p class="text-muted small mb-0">{{ item.companyName }}</p>
                          </div>
                          <span [class]="'badge-status small ' + statusBadgeClass(item.status)">{{ item.status }}</span>
                        </div>
                        <p class="text-muted small mt-2 mb-0">Applied {{ item.applicationDate | date:'mediumDate' }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-muted text-center py-4 mb-0">No activity yet.</p>
              }
            </div>
          </div>
        </div>

        @if (!stats?.total) {
          <div class="card border-0 text-center p-5 empty-dash">
            <i class="bi bi-rocket-takeoff display-4 text-primary d-block mb-3"></i>
            <h3 class="fw-bold">Start your pipeline</h3>
            <p class="text-muted mb-4">Add an application or connect email sync to populate this dashboard.</p>
            <a routerLink="/applications/add" class="btn btn-primary btn-lg">Add application</a>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .timeline { position: relative; padding-left: 1.5rem; }
    .timeline::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 4px;
      bottom: 4px;
      width: 2px;
      background: linear-gradient(180deg, #c7d2fe, #e2e8f0);
      border-radius: 2px;
    }
    .timeline-item { position: relative; padding-bottom: 1rem; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-dot {
      position: absolute;
      left: -1.15rem;
      top: 6px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 0 0 2px #e2e8f0;
    }
    .dot-primary { background: #4f46e5; box-shadow: 0 0 0 2px #4f46e5; }
    .dot-success { background: #22c55e; box-shadow: 0 0 0 2px #22c55e; }
    .dot-warning { background: #f59e0b; box-shadow: 0 0 0 2px #f59e0b; }
    .dot-danger { background: #ef4444; box-shadow: 0 0 0 2px #ef4444; }
    .dot-info { background: #06b6d4; box-shadow: 0 0 0 2px #06b6d4; }
    .dot-purple { background: #8b5cf6; box-shadow: 0 0 0 2px #8b5cf6; }
    .timeline-content {
      background: #f8fafc;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
  `],
})
export class DashboardComponent implements OnInit {
  readonly statusBadgeClass = statusBadgeClass;

  stats: Stats | null = null;
  loading = true;

  pieChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } } },
  };

  barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
      x: { grid: { display: false } },
    },
  };

  constructor(public auth: AuthService, private appService: ApplicationService) {}

  ngOnInit() {
    this.appService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.buildCharts(data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private buildCharts(data: Stats) {
    const statusColors: Record<string, string> = {
      Applied: '#6366f1',
      'Under Review': '#f59e0b',
      'Interview Scheduled': '#22c55e',
      'Offer Received': '#a855f7',
      Rejected: '#f87171',
      Accepted: '#14b8a6',
      Withdrawn: '#94a3b8',
    };

    const statusLabels = Object.keys(data.statusCounts).filter((k) => (Number(data.statusCounts[k]) || 0) > 0);
    this.pieChartData = {
      labels: statusLabels,
      datasets: [
        {
          data: statusLabels.map((k) => Number(data.statusCounts[k]) || 0),
          backgroundColor: statusLabels.map((k) => statusColors[k] || '#90a4ae'),
        },
      ],
    };

    const typeLabels = Object.keys(data.typeCounts).filter((k) => (Number(data.typeCounts[k]) || 0) > 0);
    this.barChartData = {
      labels: typeLabels,
      datasets: [
        {
          data: typeLabels.map((k) => Number(data.typeCounts[k]) || 0),
          backgroundColor: '#6366f1',
          borderRadius: 8,
        },
      ],
    };
  }

  spotlightLabel(bucket: 'upcoming' | 'past' | 'tbd'): string {
    if (bucket === 'upcoming') return 'Upcoming';
    if (bucket === 'past') return 'Past';
    return 'Date TBD';
  }

  spotlightBadge(bucket: 'upcoming' | 'past' | 'tbd'): string {
    if (bucket === 'upcoming') return 'text-bg-success';
    if (bucket === 'past') return 'text-bg-light border';
    return 'text-bg-secondary';
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      Applied: 'primary',
      'Under Review': 'warning',
      'Interview Scheduled': 'success',
      'Offer Received': 'purple',
      Rejected: 'danger',
      Accepted: 'info',
      Withdrawn: 'primary',
    };
    return map[status] || 'primary';
  }
}
