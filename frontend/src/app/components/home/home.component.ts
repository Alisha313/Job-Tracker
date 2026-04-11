import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero-gradient text-white text-center position-relative">
      <div class="container py-5 position-relative" style="z-index:1">
        <p class="mb-2 text-uppercase small fw-bold tracking-wide hero-kicker">CPS 3500 · Job search command center</p>
        <h1 class="display-4 fw-bold mb-3">
          <i class="bi bi-briefcase-fill me-2"></i>JobTracker
        </h1>
        <p class="lead mb-4 mx-auto hero-lead">
          Track every application, spot trends, and never lose an interview date — all in one colorful, organized place.
        </p>
        @if (!auth.isLoggedIn()) {
          <div class="d-flex gap-3 justify-content-center flex-wrap">
            <a routerLink="/register" class="btn btn-light btn-lg px-4 shadow hero-btn">
              <i class="bi bi-person-plus me-2"></i>Get started
            </a>
            <a routerLink="/login" class="btn btn-outline-light btn-lg px-4 hero-btn-outline">
              <i class="bi bi-box-arrow-in-right me-2"></i>Log in
            </a>
          </div>
        } @else {
          <div class="d-flex gap-3 justify-content-center flex-wrap">
            <a routerLink="/dashboard" class="btn btn-light btn-lg px-4 shadow hero-btn">
              <i class="bi bi-speedometer2 me-2"></i>Dashboard
            </a>
            <a routerLink="/applications" class="btn btn-outline-light btn-lg px-4 hero-btn-outline">
              <i class="bi bi-list-check me-2"></i>My applications
            </a>
          </div>
        }
      </div>
    </section>

    <section class="container py-5">
      <h2 class="text-center mb-2 fw-bold page-title">Why JobTracker?</h2>
      <p class="text-center text-muted mb-5 mx-auto" style="max-width:520px">
        Built for busy students and job seekers who want clarity — not another spreadsheet.
      </p>
      <div class="row g-4">
        <div class="col-md-4">
          <div class="card h-100 text-center p-4 feature-tile feature-tile-coral">
            <i class="bi bi-clipboard-data feature-icon text-warning"></i>
            <h5 class="mt-3 fw-bold">Everything in one place</h5>
            <p class="text-muted mb-0">Statuses, notes, links, and interview dates — structured so you can scan fast.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100 text-center p-4 feature-tile feature-tile-teal">
            <i class="bi bi-graph-up-arrow feature-icon text-info"></i>
            <h5 class="mt-3 fw-bold">Charts that tell a story</h5>
            <p class="text-muted mb-0">See where you’re applying, how pipelines move, and volume over time.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100 text-center p-4 feature-tile feature-tile-violet">
            <i class="bi bi-bell feature-icon" style="color:var(--violet)"></i>
            <h5 class="mt-3 fw-bold">Interview awareness</h5>
            <p class="text-muted mb-0">Upcoming interviews and recent activity keep you proactive, not reactive.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-5 band-strip">
      <div class="container">
        <div class="row g-4 align-items-center text-center text-md-start">
          <div class="col-md-3 col-6">
            <i class="bi bi-filetype-csv feature-icon-sm text-primary"></i>
            <p class="mt-2 mb-0 fw-semibold">CSV export</p>
          </div>
          <div class="col-md-3 col-6">
            <i class="bi bi-file-earmark-pdf feature-icon-sm text-danger"></i>
            <p class="mt-2 mb-0 fw-semibold">PDF reports</p>
          </div>
          <div class="col-md-3 col-6">
            <i class="bi bi-shield-lock feature-icon-sm text-success"></i>
            <p class="mt-2 mb-0 fw-semibold">Secure accounts</p>
          </div>
          <div class="col-md-3 col-6">
            <i class="bi bi-phone feature-icon-sm" style="color:var(--accent)"></i>
            <p class="mt-2 mb-0 fw-semibold">Mobile friendly</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .hero-kicker {
        letter-spacing: 0.12em;
        opacity: 0.95;
      }
      .hero-lead {
        max-width: 640px;
        opacity: 0.95;
      }
      .hero-btn {
        border: none;
        font-weight: 600;
        color: #312e81 !important;
      }
      .hero-btn-outline {
        font-weight: 600;
        border-width: 2px;
      }
      .feature-icon {
        font-size: 2.75rem;
      }
      .feature-icon-sm {
        font-size: 2.25rem;
      }
      .band-strip {
        background: linear-gradient(90deg, rgba(79, 70, 229, 0.08), rgba(6, 182, 212, 0.1), rgba(244, 114, 182, 0.08));
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
      }
    `,
  ],
})
export class HomeComponent {
  constructor(public auth: AuthService) {}
}
