import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-email-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-5 text-center">
      @if (working) {
        <div class="spinner-border text-primary"></div>
        <p class="mt-3 text-muted">Connecting Gmail…</p>
      }
      @if (!working && error) {
        <div class="alert alert-danger d-inline-block">{{ error }}</div>
        <p><a routerLink="/email" class="btn btn-primary mt-2">Back to Email sync</a></p>
      }
      @if (!working && success) {
        <p class="text-success fw-semibold">{{ success }}</p>
        <p><a routerLink="/email" class="btn btn-primary">Continue</a></p>
      }
    </div>
  `,
})
export class EmailCallbackComponent implements OnInit {
  working = true;
  error = '';
  success = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private email: EmailService
  ) {}

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');
    const err = this.route.snapshot.queryParamMap.get('error');

    if (err) {
      this.working = false;
      this.error = `Google returned: ${err}`;
      return;
    }

    if (!code || !state) {
      this.working = false;
      this.error = 'Missing authorization code. Try connecting again from Email sync.';
      return;
    }

    this.email.completeGoogle(code, state).subscribe({
      next: (res) => {
        this.working = false;
        this.success = res.message || 'Gmail connected.';
        setTimeout(() => this.router.navigate(['/email'], { replaceUrl: true }), 1200);
      },
      error: (e) => {
        this.working = false;
        this.error = e.error?.message || 'Could not complete Gmail connection.';
      },
    });
  }
}
