import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';

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
          (click)="open = true"
          aria-label="Open assistant"
        >
          <i class="bi bi-chat-dots-fill fs-4"></i>
        </button>
      }

      @if (open) {
        <div class="ai-chat-panel card shadow-lg">
          <div
            class="ai-chat-header d-flex justify-content-between align-items-center text-white px-3 py-2 rounded-top"
          >
            <span class="fw-bold"><i class="bi bi-stars me-1"></i>Job assistant</span>
            <button type="button" class="btn btn-link text-white p-0" (click)="open = false" aria-label="Close">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="ai-chat-body p-3" #scrollMe>
            @for (m of messages; track $index) {
              <div class="mb-2" [class.text-end]="m.role === 'user'">
                <span
                  class="d-inline-block px-3 py-2 rounded-3 small"
                  [class.bg-primary]="m.role === 'user'"
                  [class.text-white]="m.role === 'user'"
                  [class.bg-light]="m.role === 'assistant'"
                  [class.border]="m.role === 'assistant'"
                  style="max-width: 100%; text-align: left;"
                >
                  {{ m.content }}
                </span>
              </div>
            }
            @if (busy) {
              <p class="text-muted small mb-0"><span class="spinner-border spinner-border-sm me-1"></span>Thinking…</p>
            }
          </div>
          @if (hint) {
            <p class="px-3 small text-muted mb-0">{{ hint }}</p>
          }
          <div class="p-2 border-top d-flex gap-2">
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="Ask about interviews, tracking, résumés…"
              [(ngModel)]="input"
              (keydown.enter)="send()"
            />
            <button type="button" class="btn btn-sm btn-primary" [disabled]="busy || !input.trim()" (click)="send()">
              Send
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
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
      }
      .ai-chat-panel {
        width: min(100vw - 2rem, 380px);
        max-height: min(70vh, 520px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: none;
      }
      .ai-chat-header {
        background: linear-gradient(135deg, #4f46e5 0%, #0891b2 55%, #db2777 100%);
      }
      .ai-chat-body {
        overflow-y: auto;
        max-height: 320px;
        background: #f8fafc;
      }
    `,
  ],
})
export class AiChatComponent {
  open = false;
  busy = false;
  input = '';
  hint = '';
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content:
        'Hi! Ask me about interviews, organizing applications, or Gmail sync. Tips work offline; add OPENAI_API_KEY on the server for fuller AI answers.',
    },
  ];

  constructor(private chat: ChatService) {}

  send() {
    const text = this.input.trim();
    if (!text || this.busy) return;
    this.input = '';
    this.messages = [...this.messages, { role: 'user', content: text }];
    this.busy = true;
    this.hint = '';

    const payload = this.messages.map((m) => ({ role: m.role, content: m.content }));

    this.chat.send(payload).subscribe({
      next: (res) => {
        this.busy = false;
        this.messages = [...this.messages, { role: 'assistant', content: res.reply }];
        this.hint = res.usedOpenAI ? '' : 'Tip: add OPENAI_API_KEY to the backend for smarter replies.';
      },
      error: (e) => {
        this.busy = false;
        this.messages = [
          ...this.messages,
          {
            role: 'assistant',
            content: e.error?.message || 'Something went wrong. Is the API running?',
          },
        ];
      },
    });
  }
}
