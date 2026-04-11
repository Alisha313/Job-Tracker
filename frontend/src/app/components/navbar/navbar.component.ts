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
            @if (auth.isLoggedIn()) {
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
            } @else {
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
            }
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .nav-app {
        min-height: 4.25rem;
        background: linear-gradient(120deg, #312e81 0%, #4f46e5 40%, #0e7490 85%);
      }
      .app-shell {
        max-width: min(96vw, 1680px);
        margin: 0 auto;
      }
      .brand-text {
        font-size: 1.55rem;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .brand-icon {
        width: 2.6rem;
        height: 2.6rem;
        background: rgba(255, 255, 255, 0.2);
        font-size: 1.25rem;
      }
      .navbar .nav-link {
        font-size: 1.02rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
      }
      .nav-link.active {
        font-weight: 700;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.12);
      }
      .nav-pill.active {
        background: rgba(255, 255, 255, 0.2) !important;
      }
      .btn-add {
        background: #fbbf24;
        color: #1e1b4b !important;
        font-weight: 700;
        border: none;
      }
      .btn-add:hover {
        background: #fcd34d;
        color: #1e1b4b !important;
      }
    `,
  ],
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
