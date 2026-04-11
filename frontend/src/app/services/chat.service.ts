import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  usedOpenAI: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly url = `${environment.apiBase}/chat`;

  constructor(private http: HttpClient) {}

  send(messages: ChatMessage[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.url, { messages });
  }
}
