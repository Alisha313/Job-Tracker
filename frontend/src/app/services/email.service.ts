import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmailStatus {
  connected: boolean;
  googleConfigured: boolean;
}

export interface SyncResult {
  imported: number;
  skippedDuplicate: number;
  skippedNotJobRelated: number;
  scanned: number;
  query?: string;
  maxMessagesCap?: number;
  stoppedDueToCap?: boolean;
  hasMoreInGmail?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly base = `${environment.apiBase}/email`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<EmailStatus> {
    return this.http.get<EmailStatus>(`${this.base}/status`);
  }

  getGoogleAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.base}/google-auth-url`);
  }

  completeGoogle(code: string, state: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.base}/google-complete`, { code, state });
  }

  syncInbox(): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${this.base}/sync`, {});
  }
}
