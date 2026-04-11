import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { APPLICATION_STATUSES, JOB_TYPES } from '../../constants/application.constants';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card overflow-hidden">
            <div
              class="px-4 py-3 text-white"
              style="background: linear-gradient(135deg, #4f46e5 0%, #0891b2 55%, #db2777 100%);"
            >
              <h3 class="mb-0 fw-bold">
                <i class="bi" [class.bi-plus-circle]="!isEdit" [class.bi-pencil-square]="isEdit"></i>
                {{ isEdit ? 'Edit application' : 'New application' }}
              </h3>
              <p class="mb-0 mt-1 small opacity-75">Track role, company, dates, and notes in one place.</p>
            </div>
            <div class="p-4">
              @if (error) {
                <div class="alert alert-danger">{{ error }}</div>
              }

              @if (loadingData) {
                <div class="spinner-overlay">
                  <div class="spinner-border text-primary"></div>
                </div>
              }

              @if (!loadingData) {
                <form [formGroup]="form" (ngSubmit)="onSubmit()">
                  <p class="text-uppercase small text-muted fw-semibold mb-2">Role</p>
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label class="form-label">Job title *</label>
                      <input
                        type="text"
                        class="form-control"
                        formControlName="jobTitle"
                        placeholder="e.g. Software Engineer"
                        [class.is-invalid]="form.get('jobTitle')?.touched && form.get('jobTitle')?.invalid"
                      />
                      <div class="invalid-feedback">Job title is required</div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Company *</label>
                      <input
                        type="text"
                        class="form-control"
                        formControlName="companyName"
                        [class.is-invalid]="form.get('companyName')?.touched && form.get('companyName')?.invalid"
                      />
                      <div class="invalid-feedback">Company name is required</div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Location</label>
                      <input
                        type="text"
                        class="form-control"
                        formControlName="location"
                        placeholder="City, state or Remote"
                      />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Job type</label>
                      <select class="form-select" formControlName="jobType">
                        @for (t of jobTypes; track t) {
                          <option [value]="t">{{ t }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <p class="text-uppercase small text-muted fw-semibold mb-2">Details</p>
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label class="form-label">Salary</label>
                      <input type="text" class="form-control" formControlName="salary" placeholder="e.g. $80k – $95k" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Status</label>
                      <select class="form-select" formControlName="status">
                        @for (s of statuses; track s) {
                          <option [value]="s">{{ s }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <p class="text-uppercase small text-muted fw-semibold mb-2">Dates & links</p>
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label class="form-label">Application date</label>
                      <input type="date" class="form-control" formControlName="applicationDate" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Interview date</label>
                      <input type="date" class="form-control" formControlName="interviewDate" />
                    </div>
                    <div class="col-12">
                      <label class="form-label">Job posting URL</label>
                      <input type="url" class="form-control" formControlName="jobLink" placeholder="https://…" />
                    </div>
                    <div class="col-12">
                      <label class="form-label">Notes</label>
                      <textarea
                        class="form-control"
                        formControlName="notes"
                        rows="3"
                        placeholder="Recruiter name, interview prep, follow-up dates…"
                      ></textarea>
                    </div>
                  </div>

                  <div class="d-flex gap-2 mt-2 flex-wrap">
                    <button type="submit" class="btn btn-primary px-4" [disabled]="submitting">
                      @if (submitting) {
                        <span class="spinner-border spinner-border-sm me-2"></span>
                      }
                      {{ isEdit ? 'Save changes' : 'Save application' }}
                    </button>
                    <a routerLink="/applications" class="btn btn-outline-secondary">Cancel</a>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ApplicationFormComponent implements OnInit {
  readonly jobTypes = JOB_TYPES;
  readonly statuses = APPLICATION_STATUSES;

  form: FormGroup;
  isEdit = false;
  editId = '';
  error = '';
  submitting = false;
  loadingData = false;

  constructor(
    private fb: FormBuilder,
    private appService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      jobTitle: ['', Validators.required],
      companyName: ['', Validators.required],
      location: [''],
      jobType: ['Full-time'],
      salary: [''],
      status: ['Applied'],
      applicationDate: [new Date().toISOString().split('T')[0]],
      interviewDate: [''],
      jobLink: [''],
      notes: [''],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.editId = id;
      this.loadingData = true;
      this.appService.getById(id).subscribe({
        next: (app) => {
          this.form.patchValue({
            ...app,
            applicationDate: app.applicationDate
              ? new Date(app.applicationDate).toISOString().split('T')[0]
              : '',
            interviewDate: app.interviewDate
              ? new Date(app.interviewDate).toISOString().split('T')[0]
              : '',
          });
          this.loadingData = false;
        },
        error: () => {
          this.error = 'Failed to load application';
          this.loadingData = false;
        },
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.error = '';

    const data = { ...this.form.value };
    if (!data.interviewDate) data.interviewDate = null;

    const obs = this.isEdit
      ? this.appService.update(this.editId, data)
      : this.appService.create(data);

    obs.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/applications']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Failed to save application';
      },
    });
  }
}
