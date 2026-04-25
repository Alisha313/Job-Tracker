import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark sticky-top shadow-sm py-3 nav-app">
      <div class="container-fluid px-3 px-lg-5 app-shell">
        <a class="navbar-brand d-flex align-items-center gap-2" routerLink="/">
          <span class="brand-icon rounded-3 d-inline-flex align-items-center justify-content-center">
            <i class="bi bi-briefcase-fill"></i>
          </span>
          <span class="brand-text">JobTracker</span>
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
          aria-controls="navMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                <i class="bi bi-house me-1"></i>Home
              </a>
            </li>

            <ng-container *ngIf="auth.isLoggedIn(); else loggedOut">
              <li class="nav-item">
                <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
                  <i class="bi bi-speedometer2 me-1"></i>Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/applications" routerLinkActive="active">
                  <i class="bi bi-list-check me-1"></i>Applications
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/resume" routerLinkActive="active">
                  <i class="bi bi-file-earmark-person me-1"></i>Resume AI
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/email" routerLinkActive="active">
                  <i class="bi bi-envelope-at me-1"></i>Email
                </a>
              </li>
              <li class="nav-item d-none d-lg-block">
                <a
                  routerLink="/applications/add"
                  class="btn btn-sm btn-add ms-lg-2"
                >
                  <i class="bi bi-plus-lg me-1"></i>Add
                </a>
              </li>
              <li class="nav-item">
                <span class="nav-link text-white opacity-90 d-none d-lg-block small">
                  <i class="bi bi-person-circle me-1"></i>{{ auth.getUser()?.name }}
                </span>
              </li>
              <li class="nav-item">
                <a class="nav-link" style="cursor: pointer" (click)="auth.logout()">
                  <i class="bi bi-box-arrow-right me-1"></i>Logout
                </a>
              </li>
            </ng-container>

            <ng-template #loggedOut>
              <li class="nav-item">
                <a class="nav-link" routerLink="/login" routerLinkActive="active">
                  <i class="bi bi-box-arrow-in-right me-1"></i>Login
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link nav-pill" routerLink="/register" routerLinkActive="active">
                  <i class="bi bi-person-plus me-1"></i>Register
                </a>
              </li>
            </ng-template>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .nav-app {
        min-height: 4.75rem;
        background: linear-gradient(90deg, #0f172a 0%, #111827 55%, #1e293b 100%);
        border-bottom: 1px solid rgba(148, 163, 184, 0.25);
      }
      .app-shell {
        max-width: min(98vw, 1920px);
        margin: 0 auto;
      }
      .brand-text {
        font-size: 1.45rem;
        font-weight: 800;
        letter-spacing: -0.01em;
        color: #f8fafc;
      }
      .brand-icon {
        width: 2.4rem;
        height: 2.4rem;
        background: linear-gradient(135deg, #60a5fa, #2563eb);
        color: #f8fafc;
        font-size: 1.1rem;
      }
      .navbar .nav-link {
        color: #e2e8f0;
        font-weight: 600;
        font-size: 1.03rem;
        padding-top: 0.55rem;
        padding-bottom: 0.55rem;
        border-radius: 10px;
      }
      .nav-link.active {
        font-weight: 700;
        background: rgba(59, 130, 246, 0.18);
        color: #bfdbfe;
      }
      .nav-pill.active {
        background: rgba(59, 130, 246, 0.24) !important;
      }
      .btn-add {
        background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
        color: #fff !important;
        font-weight: 700;
        border: none;
      }
      .btn-add:hover {
        background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
        color: #fff !important;
      }
      .navbar-toggler {
        border-color: #64748b;
      }
      .navbar-toggler:focus {
        box-shadow: 0 0 0 0.2rem rgba(96, 165, 250, 0.25);
      }
      @media (max-width: 991px) {
        .navbar .nav-link {
          margin-top: 0.2rem;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
