import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { ApplicationService, Stats } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-chat-fab">
      @if (!open) {
        <button
          type="button"
          class="btn btn-primary rounded-circle shadow-lg ai-fab-btn"
          (click)="openChat()"
          aria-label="Open AI assistant"
          title="Job Search Assistant"
        >
          <i class="bi bi-stars fs-4"></i>
        </button>
      }

      @if (open) {
        <div class="ai-chat-panel card shadow-lg">
          <!-- Header -->
          <div class="ai-chat-header d-flex justify-content-between align-items-center px-3 py-2 rounded-top">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-stars fs-5"></i>
              <div>
                <span class="fw-bold d-block lh-1">AI Job Assistant</span>
                <span class="small opacity-75" style="font-size:0.7rem">
                  {{ contextLoaded ? (stats?.total || 0) + ' apps loaded' : 'Loading context…' }}
                </span>
              </div>
            </div>
            <button type="button" class="btn btn-link text-white p-0" (click)="open = false" aria-label="Close">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Quick prompts -->
          @if (messages.length <= 1 && contextLoaded) {
            <div class="quick-prompts px-3 pt-2 pb-1 d-flex flex-wrap gap-1">
              @for (q of quickPrompts; track q) {
                <button class="btn btn-sm btn-outline-primary quick-chip" (click)="sendQuick(q)">{{ q }}</button>
              }
            </div>
          }

          <!-- Messages -->
          <div class="ai-chat-body p-3">
            @for (m of messages; track $index) {
              <div class="mb-2" [class.text-end]="m.role === 'user'">
                <span
                  class="d-inline-block px-3 py-2 rounded-3 small"
                  [class.user-bubble]="m.role === 'user'"
                  [class.assistant-bubble]="m.role === 'assistant'"
                  style="max-width: 90%; text-align: left; white-space: pre-line;"
                >{{ m.content }}</span>
              </div>
            }
            @if (busy) {
              <div class="mb-2">
                <span class="assistant-bubble d-inline-block px-3 py-2 rounded-3 small">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </span>
              </div>
            }
          </div>

          <!-- Input -->
          <div class="p-2 border-top d-flex gap-2">
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="Ask about interviews, resumes, your pipeline…"
              [(ngModel)]="input"
              (keydown.enter)="send()"
            />
            <button
              type="button"
              class="btn btn-sm btn-primary"
              [disabled]="busy || !input.trim()"
              (click)="send()"
            >
              <i class="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ai-chat-fab {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      z-index: 1080;
    }
    .ai-fab-btn {
      width: 3.5rem;
      height: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse-ring 2.5s ease-in-out infinite;
    }
    @keyframes pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0 rgba(79,70,229,0.4); }
      50% { box-shadow: 0 0 0 8px rgba(79,70,229,0); }
    }
    .ai-chat-panel {
      width: min(100vw - 2rem, 390px);
      max-height: min(72vh, 540px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: none;
    }
    .ai-chat-header {
      background: linear-gradient(135deg, #4f46e5 0%, #0891b2 55%, #db2777 100%);
      color: #fff;
    }
    .ai-chat-body {
      overflow-y: auto;
      flex: 1;
      background: #f8fafc;
    }
    .user-bubble {
      background: #4f46e5;
      color: #fff;
    }
    .assistant-bubble {
      background: #fff;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .quick-prompts { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .quick-chip {
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .typing-dot {
      display: inline-block;
      width: 6px; height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      margin: 0 2px;
      animation: typing 1.2s ease-in-out infinite;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
  `],
})
export class AiChatComponent implements OnInit {
  open = false;
  busy = false;
  input = '';
  contextLoaded = false;
  stats: Stats | null = null;

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content: "Hi! I'm your AI job search assistant. I can see your applications, upcoming interviews, and pipeline — ask me anything about your job search!",
    },
  ];

  quickPrompts = ['How am I doing?', 'Interview tips', 'Resume advice', 'Follow-up strategy'];

  constructor(
    private chat: ChatService,
    private appService: ApplicationService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.loadContext();
    }
  }

  openChat() {
    this.open = true;
    if (!this.contextLoaded && this.auth.isLoggedIn()) {
      this.loadContext();
    }
  }

  private loadContext() {
    this.appService.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.contextLoaded = true;
      },
      error: () => {
        this.contextLoaded = true;
      },
    });
  }

  sendQuick(prompt: string) {
    this.input = prompt;
    this.send();
  }

  send() {
    const text = this.input.trim();
    if (!text || this.busy) return;
    this.input = '';
    this.messages = [...this.messages, { role: 'user', content: text }];
    this.busy = true;

    const payload = this.messages.map((m) => ({ role: m.role, content: m.content }));

    this.chat.send(payload).subscribe({
      next: (res) => {
        this.busy = false;
        this.messages = [...this.messages, { role: 'assistant', content: res.reply }];
      },
      error: (e) => {
        this.busy = false;
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content: e.error?.message || 'Something went wrong. Is the backend running?',
          },
        ];
      },
    });
  }
}
