import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Application {
  _id?: string;
  userId?: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  salary: string;
  applicationDate: string;
  status: string;
  interviewDate: string | null;
  jobLink: string;
  notes: string;
  sourceMessageId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stats {
  total: number;
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  timeline: Record<string, number>;
  upcomingInterviews: {
    id: string;
    jobTitle: string;
    companyName: string;
    interviewDate: string;
    status: string;
  }[];
  pastDueInterviews: {
    id: string;
    jobTitle: string;
    companyName: string;
    interviewDate: string;
  }[];
  recentActivity: {
    id: string;
    jobTitle: string;
    companyName: string;
    status: string;
    applicationDate: string;
    updatedAt: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly apiUrl = `${environment.apiBase}/applications`;
  private readonly statsUrl = `${environment.apiBase}/stats`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Application[]> {
    return this.http.get<Application[]>(this.apiUrl);
  }

  getById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Application>): Observable<Application> {
    return this.http.post<Application>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Application>): Observable<Application> {
    return this.http.put<Application>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.statsUrl}/summary`);
  }
}
