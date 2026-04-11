import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-landing">
      <section class="hl-hero-v2">
        <div class="hl-hero-inner">
          <div>
            <div class="hl-chips">
              <span class="hl-chip"><span class="hl-chip-dot"></span>CPS 3500 · Senior project</span>
              <span class="hl-chip">Track · Sync · Export</span>
            </div>
            <h1 class="hl-headline">
              Land the role.<br />
              <span class="hl-gradient-text">Keep your clarity.</span>
            </h1>
            <p class="hl-sub">
              One calm place for every application — Gmail-aware, dashboard-sharp, and ready for demo day or interview
              week.
            </p>
            <p class="hl-trust">
              <strong>No noise.</strong> Free to try · Secure login · CSV & PDF when you need them
            </p>
            @if (!auth.isLoggedIn()) {
              <div class="hl-actions">
                <a routerLink="/register" class="btn btn-lg hl-btn-glow">
                  <i class="bi bi-lightning-charge-fill me-2"></i>Get started free
                </a>
                <a routerLink="/login" class="btn btn-lg hl-btn-outline">
                  <i class="bi bi-box-arrow-in-right me-2"></i>I have an account
                </a>
              </div>
            } @else {
              <div class="hl-actions">
                <a routerLink="/dashboard" class="btn btn-lg hl-btn-glow">
                  <i class="bi bi-speedometer2 me-2"></i>Open dashboard
                </a>
                <a routerLink="/applications" class="btn btn-lg hl-btn-outline">
                  <i class="bi bi-list-check me-2"></i>My applications
                </a>
              </div>
            }
          </div>
          <div class="hl-showcase-wrap">
            <div class="hl-showcase card">
              <div class="hl-sc-top">
                <span></span><span></span><span></span>
                <span class="hl-sc-title">JobTracker live</span>
              </div>
              <div class="hl-sc-body">
                <div class="hl-sc-metrics">
                  <div class="hl-sc-metric">
                    <span>Active</span>
                    <strong>24</strong>
                  </div>
                  <div class="hl-sc-metric">
                    <span>Interviews</span>
                    <strong class="hl-accent">6</strong>
                  </div>
                  <div class="hl-sc-metric">
                    <span>This month</span>
                    <strong>+9</strong>
                  </div>
                </div>
                <div class="hl-sc-bars" aria-hidden="true">
                  <div class="bar" style="height:38%"></div>
                  <div class="bar" style="height:62%"></div>
                  <div class="bar" style="height:48%"></div>
                  <div class="bar" style="height:78%"></div>
                  <div class="bar" style="height:55%"></div>
                  <div class="bar" style="height:92%"></div>
                </div>
                <p class="hl-sc-caption">Preview only — your numbers load from your data</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="hl-proof">
        <div class="hl-proof-inner">
          <div class="hl-proof-item">
            <div class="hl-stat-num">1</div>
            <p>Inbox + tracker linked</p>
          </div>
          <div class="hl-proof-item">
            <div class="hl-stat-num">∞</div>
            <p>Applications, no cap</p>
          </div>
          <div class="hl-proof-item">
            <div class="hl-stat-num">24/7</div>
            <p>Your data, your pace</p>
          </div>
          <div class="hl-proof-item">
            <div class="hl-stat-num">A+</div>
            <p>Showcase-ready UI</p>
          </div>
        </div>
      </section>

      <section class="hl-features-v2">
        <div class="hl-features-inner-v2">
          <header class="hl-section-head-v2">
            <p class="hl-section-kicker">Designed to be shown off</p>
            <h2 class="hl-section-title">Powerful underneath. Quiet on the surface.</h2>
            <p class="hl-section-sub">
              The structure of a spreadsheet, the polish of a product — so your search looks as intentional as you are.
            </p>
          </header>
          <div class="hl-feature-grid">
            <article class="hl-fcard">
              <div class="hl-fcard-icon c1"><i class="bi bi-kanban-fill"></i></div>
              <h3>Pipeline at a glance</h3>
              <p>Statuses, companies, and dates in one scannable list — with detail pages when you need the full story.</p>
            </article>
            <article class="hl-fcard">
              <div class="hl-fcard-icon c2"><i class="bi bi-envelope-heart"></i></div>
              <h3>Gmail that actually helps</h3>
              <p>Connect once and pull job-related context into your tracker instead of drowning in threads.</p>
            </article>
            <article class="hl-fcard">
              <div class="hl-fcard-icon c3"><i class="bi bi-pie-chart-fill"></i></div>
              <h3>Dashboards that pop</h3>
              <p>See status mix and role types with charts designed to look good in a demo or a portfolio.</p>
            </article>
            <article class="hl-fcard">
              <div class="hl-fcard-icon c4"><i class="bi bi-calendar2-check"></i></div>
              <h3>Interview awareness</h3>
              <p>Surface interview-stage roles and dates so “what’s next?” is always one click away.</p>
            </article>
            <article class="hl-fcard">
              <div class="hl-fcard-icon c5"><i class="bi bi-file-earmark-arrow-down"></i></div>
              <h3>CSV & PDF exports</h3>
              <p>Hand off to advisors, mentors, or your own files — filtered lists export in seconds.</p>
            </article>
            <article class="hl-fcard">
              <div class="hl-fcard-icon c6"><i class="bi bi-shield-lock"></i></div>
              <h3>Your account, your data</h3>
              <p>Sign in securely; your applications stay tied to you — built for a real class project, not a toy demo.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="hl-steps">
        <div class="hl-steps-inner">
          <h2 class="hl-steps-title">Three steps to clarity</h2>
          <div class="hl-step-row">
            <div class="hl-step">
              <span class="hl-step-num">1</span>
              <div>
                <h4>Create your account</h4>
                <p>Sign up in seconds — no credit card, no clutter.</p>
              </div>
            </div>
            <div class="hl-step">
              <span class="hl-step-num">2</span>
              <div>
                <h4>Add or sync applications</h4>
                <p>Type a role manually or let Gmail help fill the pipeline.</p>
              </div>
            </div>
            <div class="hl-step">
              <span class="hl-step-num">3</span>
              <div>
                <h4>Own your search</h4>
                <p>Use the dashboard and list to steer every follow-up with confidence.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="hl-cta-band">
        <div class="hl-cta-inner">
          <h2 class="hl-cta-title">Ready when you are.</h2>
          <p class="hl-cta-sub">One account. One pipeline. Neon optional — clarity included.</p>
          @if (!auth.isLoggedIn()) {
            <a routerLink="/register" class="btn btn-lg hl-btn-glow">
              <i class="bi bi-rocket-takeoff me-2"></i>Create your free account
            </a>
          } @else {
            <a routerLink="/dashboard" class="btn btn-lg hl-btn-glow">
              <i class="bi bi-arrow-right-circle me-2"></i>Go to dashboard
            </a>
          }
        </div>
      </section>

      <section class="hl-footer-strip">
        <div class="hl-strip-inner">
          <div class="hl-strip-item"><i class="bi bi-filetype-csv"></i><span>CSV export</span></div>
          <div class="hl-strip-item"><i class="bi bi-file-earmark-pdf"></i><span>PDF reports</span></div>
          <div class="hl-strip-item"><i class="bi bi-shield-lock"></i><span>Secure login</span></div>
          <div class="hl-strip-item"><i class="bi bi-phone"></i><span>Works on phone</span></div>
        </div>
      </section>
    </div>
  `,
})
export class HomeComponent {
  constructor(public auth: AuthService) {}
}
