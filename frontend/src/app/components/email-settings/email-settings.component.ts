import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmailService, EmailStatus, SyncResult } from '../../services/email.service';

@Component({
  selector: 'app-email-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="page-header">
        <h2 class="page-title mb-1"><i class="bi bi-envelope-at me-2"></i>Email sync</h2>
        <p class="text-muted mb-0">
          Connect Gmail to scan your inbox (up to a configurable limit per run) for job-related messages and add them
          automatically — you can still edit everything afterward.
        </p>
      </div>

      @if (loading) {
        <div class="spinner-border text-primary"></div>
      }

      @if (!loading && status) {
        @if (!status.googleConfigured) {
          <div class="alert alert-warning">
            <strong>Gmail API not configured on the server.</strong> Add
            <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> to
            <code>backend/.env</code> (see Google Cloud Console → APIs → Gmail API → OAuth client). Redirect URI must be
            <code>http://localhost:4200/email-callback</code> (or your deployed URL).
          </div>
        }

        <div class="card p-4 mb-4">
          <div class="d-flex flex-wrap align-items-center gap-3 justify-content-between">
            <div>
              <p class="mb-1 fw-semibold">Gmail connection</p>
              <p class="text-muted small mb-0">
                @if (status.connected) {
                  <span class="text-success"><i class="bi bi-check-circle me-1"></i>Connected</span>
                } @else {
                  <span>Not connected</span>
                }
              </p>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="!status.googleConfigured || connecting"
                (click)="connectGmail()"
              >
                @if (connecting) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                }
                {{ status.connected ? 'Reconnect Gmail' : 'Connect Gmail' }}
              </button>
              <button
                type="button"
                class="btn btn-outline-primary"
                [disabled]="!status.connected || syncing"
                (click)="syncNow()"
              >
                @if (syncing) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                }
                Sync from inbox
              </button>
            </div>
          </div>

          @if (syncMessage) {
            <div
              class="alert mt-3 mb-0 small"
              [class.alert-danger]="syncMessage.includes('insufficient') || syncMessage.includes('403')"
              [class.alert-info]="!syncMessage.includes('insufficient') && !syncMessage.includes('403')"
              style="white-space: pre-wrap"
            >
              {{ syncMessage }}
            </div>
          }
        </div>

        <div class="card p-4">
          <h5 class="fw-bold mb-3">How it works</h5>
          <ol class="mb-0 text-muted">
            <li class="mb-2">We only request read access to Gmail (no sending mail).</li>
            <li class="mb-2">
              Sync walks your <strong>Inbox</strong> (newest first), up to
              <code>GMAIL_SYNC_MAX_MESSAGES</code> per run — see backend <code>.env</code>. To only scan the last year, set
              <code>GMAIL_SYNC_QUERY=in:inbox newer_than:365d</code>.
            </li>
            <li class="mb-2">Titles and companies are guessed from subject lines — <strong>always review</strong> imported rows under Applications.</li>
            <li>Duplicates from the same email thread are skipped.</li>
          </ol>
        </div>

        <p class="mt-3">
          <a routerLink="/applications" class="btn btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Applications</a>
        </p>
      }
    </div>
  `,
})
export class EmailSettingsComponent implements OnInit {
  status: EmailStatus | null = null;
  loading = true;
  connecting = false;
  syncing = false;
  syncMessage = '';

  constructor(private emailService: EmailService) {}

  private formatSyncResult(r: SyncResult): string {
    const lines = [
      `Scanned ${r.scanned} inbox message(s) — imported ${r.imported} new application(s).`,
      `Skipped ${r.skippedDuplicate} already imported, ${r.skippedNotJobRelated} not job-related.`,
    ];
    if (r.query) lines.push(`Gmail search: ${r.query}`);
    if (r.maxMessagesCap != null) lines.push(`Cap this run: ${r.maxMessagesCap} messages (backend GMAIL_SYNC_MAX_MESSAGES).`);
    if (r.hasMoreInGmail) {
      lines.push(
        `More mail exists past this cap — increase GMAIL_SYNC_MAX_MESSAGES in backend/.env and sync again to continue older mail.`
      );
    }
    return lines.join('\n');
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.emailService.getStatus().subscribe({
      next: (s) => {
        this.status = s;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  connectGmail() {
    this.connecting = true;
    this.syncMessage = '';
    this.emailService.getGoogleAuthUrl().subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (e) => {
        this.connecting = false;
        this.syncMessage = e.error?.message || 'Could not start Google sign-in.';
      },
    });
  }

  syncNow() {
    this.syncing = true;
    this.syncMessage = '';
    this.emailService.syncInbox().subscribe({
      next: (r) => {
        this.syncing = false;
        this.syncMessage = this.formatSyncResult(r);
        this.load();
      },
      error: (e) => {
        this.syncing = false;
        const base = e.error?.message || 'Sync failed.';
        const hint = e.error?.hint;
        this.syncMessage = hint ? `${base}\n\n${hint}` : base;
      },
    });
  }
}
