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
        background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
        border-top: 3px solid transparent;
        border-image: linear-gradient(90deg, #4f46e5, #06b6d4, #ec4899) 1;
      }
    `,
  ],
})
export class FooterComponent {}
