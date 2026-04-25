import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer-slab mt-auto">
      <div class="container py-3">
        <p class="mb-0 text-center small text-muted">
          <i class="bi bi-briefcase me-1" style="color: var(--primary)"></i>
          JobTracker — organize your search 
        </p>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer-slab {
        background: #ffffff;
        border-top: 1px solid #e5e7eb;
      }
      .footer-slab p {
        color: #64748b !important;
        font-weight: 500;
      }
    `,
  ],
})
export class FooterComponent {}
