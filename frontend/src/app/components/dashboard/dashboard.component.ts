import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ApplicationService, Stats } from '../../services/application.service';
import { AiService, InsightsResponse } from '../../services/ai.service';
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
        <!-- ─── Stat cards ─────────────────────────────────────── -->
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

        <!-- ─── AI Insights card ───────────────────────────────── -->
        <div class="card ai-insights-card mb-4 overflow-hidden">
          <div class="ai-insights-header px-4 py-3 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <span class="ai-badge"><i class="bi bi-stars"></i></span>
              <div>
                <h2 class="h5 mb-0 fw-bold text-white">AI Pipeline Insights</h2>
                <span class="small text-white opacity-75">Personalized analysis of your job search</span>
              </div>
            </div>
            <button
              class="btn btn-light btn-sm fw-semibold"
              (click)="loadInsights()"
              [disabled]="insightsLoading"
            >
              @if (insightsLoading) {
                <span class="spinner-border spinner-border-sm me-1"></span>Analyzing…
              } @else {
                <i class="bi bi-arrow-clockwise me-1"></i>{{ insights ? 'Refresh' : 'Analyze' }}
              }
            </button>
          </div>

          @if (!insights && !insightsLoading) {
            <div class="ai-insights-empty px-4 py-5 text-center">
              <i class="bi bi-graph-up-arrow fs-1 text-muted d-block mb-3"></i>
              <p class="text-muted mb-3">Get an AI analysis of your job search pipeline — success rate, actionable tips, and a health score.</p>
              <button class="btn btn-primary" (click)="loadInsights()">
                <i class="bi bi-stars me-1"></i> Analyze My Pipeline
              </button>
            </div>
          }

          @if (insightsLoading) {
            <div class="py-5 text-center">
              <div class="spinner-border text-primary mb-3"></div>
              <p class="text-muted">Analyzing your pipeline…</p>
            </div>
          }

          @if (insights && !insightsLoading) {
            <div class="ai-insights-body px-4 py-4">
              <div class="row g-4 align-items-start">
                <!-- Score + metrics -->
                <div class="col-12 col-md-3 text-center">
                  @if (insights.score !== null) {
                    <div class="score-ring mb-3 mx-auto" [style.--pct]="insights.score + '%'">
                      <svg viewBox="0 0 80 80">
                        <circle class="score-bg" cx="40" cy="40" r="34"/>
                        <circle class="score-fill" cx="40" cy="40" r="34"
                          [attr.stroke-dasharray]="'213.6 213.6'"
                          [attr.stroke-dashoffset]="213.6 - (213.6 * (insights.score || 0) / 100)"
                          [attr.stroke]="scoreColor(insights.score)"
                        />
                      </svg>
                      <span class="score-num fw-bold" [style.color]="scoreColor(insights.score)">{{ insights.score }}</span>
                    </div>
                    <p class="small text-muted fw-semibold mb-2">Pipeline Health</p>
                  }
                  @if (insights.interviewRate !== undefined) {
                    <div class="metric-pill">
                      <span class="metric-val">{{ insights.interviewRate }}%</span>
                      <span class="metric-label">Interview Rate</span>
                    </div>
                  }
                  @if (insights.responseRate !== undefined) {
                    <div class="metric-pill mt-2">
                      <span class="metric-val">{{ insights.responseRate }}%</span>
                      <span class="metric-label">Response Rate</span>
                    </div>
                  }
                </div>

                <!-- Summary + insights -->
                <div class="col-12 col-md-9">
                  <p class="insights-summary mb-4">
                    <i class="bi bi-chat-quote-fill me-2 text-primary"></i>{{ insights.summary }}
                  </p>
                  <div class="d-flex flex-column gap-3">
                    @for (item of insights.insights; track $index) {
                      <div class="insight-item d-flex gap-3 align-items-start">
                        <span class="insight-dot mt-1"></span>
                        <p class="mb-0 small">{{ item }}</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
        <!-- End AI Insights -->

        <!-- ─── Charts ─────────────────────────────────────────── -->
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

        <!-- ─── Interviews + Activity ─────────────────────────── -->
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
    /* Timeline */
    .timeline { position: relative; padding-left: 1.5rem; }
    .timeline::before {
      content: '';
      position: absolute;
      left: 6px; top: 4px; bottom: 4px;
      width: 2px;
      background: linear-gradient(180deg, #c7d2fe, #e2e8f0);
      border-radius: 2px;
    }
    .timeline-item { position: relative; padding-bottom: 1rem; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-dot {
      position: absolute; left: -1.15rem; top: 6px;
      width: 12px; height: 12px;
      border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 2px #e2e8f0;
    }
    .dot-primary { background:#4f46e5; box-shadow:0 0 0 2px #4f46e5; }
    .dot-success { background:#22c55e; box-shadow:0 0 0 2px #22c55e; }
    .dot-warning { background:#f59e0b; box-shadow:0 0 0 2px #f59e0b; }
    .dot-danger  { background:#ef4444; box-shadow:0 0 0 2px #ef4444; }
    .dot-info    { background:#06b6d4; box-shadow:0 0 0 2px #06b6d4; }
    .dot-purple  { background:#8b5cf6; box-shadow:0 0 0 2px #8b5cf6; }
    .timeline-content {
      background: #f8fafc; padding: 0.85rem 1rem;
      border-radius: 12px; border: 1px solid var(--border);
    }

    /* AI Insights card */
    .ai-insights-card { border: none; box-shadow: 0 4px 24px rgba(79,70,229,0.10); }
    .ai-insights-header { background: linear-gradient(135deg, #4f46e5 0%, #0891b2 60%, #db2777 100%); }
    .ai-badge {
      width: 40px; height: 40px;
      background: rgba(255,255,255,0.2); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.2rem;
    }
    .ai-insights-empty { background: #fafbff; }
    .ai-insights-body { background: #fff; }

    .insights-summary {
      font-size: 1.05rem; font-weight: 500; color: #1e293b;
      padding: 14px 18px;
      background: #f0f4ff; border-left: 4px solid #4f46e5; border-radius: 0 10px 10px 0;
    }
    .insight-item {
      padding: 10px 16px;
      background: #f8fafc; border: 1px solid #e8ecff; border-radius: 10px;
    }
    .insight-dot {
      width: 10px; height: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #4f46e5, #0891b2);
      border-radius: 50%;
    }

    /* Score ring */
    .score-ring {
      position: relative; width: 90px; height: 90px;
    }
    .score-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .score-bg { fill: none; stroke: #e2e8f0; stroke-width: 8; }
    .score-fill { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
    .score-num {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem;
    }

    .metric-pill {
      display: flex; flex-direction: column;
      background: #f0f4ff; border-radius: 10px; padding: 8px 12px;
    }
    .metric-val { font-size: 1.3rem; font-weight: 700; color: #4f46e5; }
    .metric-label { font-size: 0.72rem; color: #64748b; font-weight: 600; }
  `],
})
export class DashboardComponent implements OnInit {
  readonly statusBadgeClass = statusBadgeClass;

  stats: Stats | null = null;
  loading = true;

  // AI Insights
  insights: InsightsResponse | null = null;
  insightsLoading = false;

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

  constructor(
    public auth: AuthService,
    private appService: ApplicationService,
    private aiService: AiService,
  ) {}

  ngOnInit() {
    this.appService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.buildCharts(data);
        this.loading = false;
        // Auto-load insights after stats load
        this.loadInsights();
      },
      error: () => { this.loading = false; },
    });
  }

  loadInsights() {
    if (!this.stats) return;
    this.insightsLoading = true;
    this.aiService.getInsights(this.stats).subscribe({
      next: (data) => { this.insights = data; this.insightsLoading = false; },
      error: () => { this.insightsLoading = false; },
    });
  }

  scoreColor(score: number | null): string {
    if (score === null) return '#94a3b8';
    if (score >= 70) return '#22c55e';
    if (score >= 45) return '#f59e0b';
    return '#ef4444';
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
      datasets: [{
        data: statusLabels.map((k) => Number(data.statusCounts[k]) || 0),
        backgroundColor: statusLabels.map((k) => statusColors[k] || '#90a4ae'),
      }],
    };

    const typeLabels = Object.keys(data.typeCounts).filter((k) => (Number(data.typeCounts[k]) || 0) > 0);
    this.barChartData = {
      labels: typeLabels,
      datasets: [{
        data: typeLabels.map((k) => Number(data.typeCounts[k]) || 0),
        backgroundColor: '#6366f1',
        borderRadius: 8,
      }],
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
