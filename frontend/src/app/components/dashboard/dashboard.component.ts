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
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 page-header">
        <h2 class="mb-0 page-title">
          <i class="bi bi-speedometer2 me-2"></i>Dashboard
        </h2>
        <span class="badge rounded-pill px-3 py-2" style="background: linear-gradient(135deg,#e0e7ff,#cffafe); color:#4338ca; font-weight:600;">
          Hi, {{ auth.getUser()?.name || 'there' }}
        </span>
      </div>

      @if (loading) {
        <div class="spinner-overlay">
          <div class="spinner-border text-primary"></div>
        </div>
      }

      @if (!loading) {
        <!-- Stat Cards -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <div class="stat-card stat-total card p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1 small fw-semibold">Total</p>
                  <h3 class="mb-0 fw-bold" style="color:var(--primary)">{{ stats?.total || 0 }}</h3>
                </div>
                <i class="bi bi-briefcase-fill fs-2 opacity-75" style="color:var(--primary)"></i>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="stat-card stat-review card p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1 small fw-semibold">Under review</p>
                  <h3 class="mb-0 fw-bold" style="color:#d97706">{{ stats?.statusCounts?.['Under Review'] || 0 }}</h3>
                </div>
                <i class="bi bi-hourglass-split fs-2 opacity-75" style="color:#d97706"></i>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="stat-card stat-interview card p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1 small fw-semibold">Interviews</p>
                  <h3 class="mb-0 fw-bold" style="color:#059669">{{ stats?.statusCounts?.['Interview Scheduled'] || 0 }}</h3>
                </div>
                <i class="bi bi-calendar-event fs-2 opacity-75" style="color:#059669"></i>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="stat-card stat-offer card p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1 small fw-semibold">Offers</p>
                  <h3 class="mb-0 fw-bold" style="color:#7c3aed">{{ stats?.statusCounts?.['Offer Received'] || 0 }}</h3>
                </div>
                <i class="bi bi-trophy-fill fs-2 opacity-75" style="color:#7c3aed"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="row g-4 mb-4">
          <div class="col-lg-6">
            <div class="card p-3">
              <h5 class="mb-3 fw-bold"><i class="bi bi-pie-chart me-2 text-primary"></i>By status</h5>
              @if (pieChartData.labels!.length > 0) {
                <canvas baseChart [data]="pieChartData" [options]="pieChartOptions" type="pie"></canvas>
              } @else {
                <p class="text-muted text-center py-4">No data yet</p>
              }
            </div>
          </div>
          <div class="col-lg-6">
            <div class="card p-3">
              <h5 class="mb-3 fw-bold"><i class="bi bi-bar-chart me-2 text-primary"></i>By job type</h5>
              @if (barChartData.labels!.length > 0) {
                <canvas baseChart [data]="barChartData" [options]="barChartOptions" type="bar"></canvas>
              } @else {
                <p class="text-muted text-center py-4">No data yet</p>
              }
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-lg-8">
            <div class="card p-3">
              <h5 class="mb-3 fw-bold"><i class="bi bi-graph-up me-2 text-primary"></i>Over time</h5>
              @if (lineChartData.labels!.length > 0) {
                <canvas baseChart [data]="lineChartData" [options]="lineChartOptions" type="line"></canvas>
              } @else {
                <p class="text-muted text-center py-4">No data yet</p>
              }
            </div>
          </div>

          <!-- Interview Reminders -->
          <div class="col-lg-4">
            <div class="card p-3 h-100">
              <h5 class="mb-3 fw-bold"><i class="bi bi-bell me-2 text-primary"></i>Upcoming interviews</h5>
              @if (stats?.upcomingInterviews?.length) {
                @for (interview of stats!.upcomingInterviews; track interview.id) {
                  <div class="reminder-item d-flex align-items-start gap-2 mb-2 p-2 rounded"
                    [class.reminder-urgent]="isUrgent(interview.interviewDate)"
                    [class.reminder-soon]="isSoon(interview.interviewDate) && !isUrgent(interview.interviewDate)">
                    <i class="bi bi-calendar-check mt-1"
                      [class.text-danger]="isUrgent(interview.interviewDate)"
                      [class.text-warning]="isSoon(interview.interviewDate) && !isUrgent(interview.interviewDate)"
                      [class.text-primary]="!isSoon(interview.interviewDate)"></i>
                    <div>
                      <p class="mb-0 fw-semibold small">{{ interview.jobTitle }}</p>
                      <p class="mb-0 text-muted small">{{ interview.companyName }}</p>
                      <p class="mb-0 small">{{ interview.interviewDate | date:'MMM d, y' }}</p>
                    </div>
                  </div>
                }
              } @else {
                <p class="text-muted text-center py-3">No upcoming interviews</p>
              }

              @if (stats?.pastDueInterviews?.length) {
                <h6 class="mt-3 text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Past Due</h6>
                @for (interview of stats!.pastDueInterviews; track interview.id) {
                  <div class="reminder-item d-flex align-items-start gap-2 mb-2 p-2 rounded bg-danger bg-opacity-10">
                    <i class="bi bi-exclamation-circle text-danger mt-1"></i>
                    <div>
                      <p class="mb-0 fw-semibold small">{{ interview.jobTitle }}</p>
                      <p class="mb-0 text-muted small">{{ interview.companyName }}</p>
                      <p class="mb-0 text-danger small">{{ interview.interviewDate | date:'MMM d, y' }}</p>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="card p-4 mb-4">
          <h5 class="mb-4 fw-bold"><i class="bi bi-clock-history me-2 text-primary"></i>Recent activity</h5>
          @if (stats?.recentActivity?.length) {
            <div class="timeline">
              @for (item of stats!.recentActivity; track item.id; let i = $index) {
                <div class="timeline-item">
                  <div class="timeline-dot" [class]="'dot-' + getStatusColor(item.status)"></div>
                  <div class="timeline-content">
                    <div class="d-flex justify-content-between align-items-start flex-wrap">
                      <div>
                        <h6 class="mb-0">{{ item.jobTitle }}</h6>
                        <p class="text-muted small mb-0">{{ item.companyName }}</p>
                      </div>
                      <span [class]="'badge-status small ' + statusBadgeClass(item.status)">{{ item.status }}</span>
                    </div>
                    <p class="text-muted small mt-1 mb-0">
                      Applied {{ item.applicationDate | date:'mediumDate' }}
                    </p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-muted text-center py-3">No activity yet. Start adding applications!</p>
          }
        </div>

        @if (!stats?.total) {
          <div class="text-center py-4">
            <i class="bi bi-rocket-takeoff display-3 text-primary"></i>
            <h4 class="mt-3">Ready to start tracking?</h4>
            <p class="text-muted">Add your first job application to see your dashboard come to life!</p>
            <a routerLink="/applications/add" class="btn btn-primary btn-lg">
              <i class="bi bi-plus-lg me-2"></i>Add Application
            </a>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .reminder-item { transition: background-color 0.2s; }
    .reminder-urgent { background-color: #ffebee; }
    .reminder-soon { background-color: #fff8e1; }

    .timeline { position: relative; padding-left: 30px; }
    .timeline::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #dee2e6;
    }
    .timeline-item {
      position: relative;
      padding-bottom: 20px;
    }
    .timeline-dot {
      position: absolute;
      left: -26px;
      top: 4px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 0 0 2px #dee2e6;
    }
    .dot-primary { background: #4f46e5; box-shadow: 0 0 0 2px #4f46e5; }
    .dot-success { background: #22c55e; box-shadow: 0 0 0 2px #22c55e; }
    .dot-warning { background: #f59e0b; box-shadow: 0 0 0 2px #f59e0b; }
    .dot-danger { background: #ef4444; box-shadow: 0 0 0 2px #ef4444; }
    .dot-info { background: #06b6d4; box-shadow: 0 0 0 2px #06b6d4; }
    .dot-purple { background: #8b5cf6; box-shadow: 0 0 0 2px #8b5cf6; }
    .timeline-content {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 12px 16px;
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
    plugins: { legend: { position: 'bottom' } },
  };

  barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
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

    const statusLabels = Object.keys(data.statusCounts);
    this.pieChartData = {
      labels: statusLabels,
      datasets: [
        {
          data: statusLabels.map((k) => data.statusCounts[k]),
          backgroundColor: statusLabels.map((k) => statusColors[k] || '#90a4ae'),
        },
      ],
    };

    const typeLabels = Object.keys(data.typeCounts);
    this.barChartData = {
      labels: typeLabels,
      datasets: [
        {
          data: typeLabels.map((k) => data.typeCounts[k]),
          backgroundColor: '#6366f1',
          borderRadius: 8,
        },
      ],
    };

    const months = Object.keys(data.timeline).sort();
    this.lineChartData = {
      labels: months.map((m) => {
        const [y, mo] = m.split('-');
        return new Date(+y, +mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      datasets: [
        {
          data: months.map((m) => data.timeline[m]),
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79,70,229,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 5,
        },
      ],
    };
  }

  isUrgent(dateStr: string): boolean {
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 86400000 * 2;
  }

  isSoon(dateStr: string): boolean {
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 86400000 * 7;
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
