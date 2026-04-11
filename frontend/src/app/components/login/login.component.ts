import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container auth-shell">
      <div class="row justify-content-center w-100">
        <div class="col-md-5 col-lg-4">
          <div class="auth-card shadow">
            <div class="auth-card-header">
              <h3 class="d-flex align-items-center justify-content-center gap-2">
                <i class="bi bi-box-arrow-in-right"></i> Welcome back
              </h3>
            </div>
            <div class="p-4">
              @if (error) {
                <div class="alert alert-danger alert-dismissible">
                  {{ error }}
                  <button type="button" class="btn-close" (click)="error = ''" aria-label="Close"></button>
                </div>
              }

              <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label fw-semibold">Email</label>
                  <input
                    type="email"
                    class="form-control form-control-lg"
                    formControlName="email"
                    autocomplete="username"
                    [class.is-invalid]="form.get('email')?.touched && form.get('email')?.invalid"
                  />
                  @if (form.get('email')?.touched && form.get('email')?.errors?.['required']) {
                    <div class="invalid-feedback">Email is required</div>
                  }
                  @if (form.get('email')?.touched && form.get('email')?.errors?.['email']) {
                    <div class="invalid-feedback">Enter a valid email</div>
                  }
                </div>

                <div class="mb-4">
                  <label class="form-label fw-semibold">Password</label>
                  <input
                    type="password"
                    class="form-control form-control-lg"
                    formControlName="password"
                    autocomplete="current-password"
                    [class.is-invalid]="form.get('password')?.touched && form.get('password')?.invalid"
                  />
                  @if (form.get('password')?.touched && form.get('password')?.errors?.['required']) {
                    <div class="invalid-feedback">Password is required</div>
                  }
                </div>

                <button type="submit" class="btn btn-primary w-100 py-2 btn-lg" [disabled]="loading">
                  @if (loading) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                  }
                  Log in
                </button>
              </form>

              <p class="text-center mt-4 mb-0 text-muted">
                New here?
                <a routerLink="/register">Create an account</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  form: FormGroup;
  error = '';
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed';
      },
    });
  }
}
