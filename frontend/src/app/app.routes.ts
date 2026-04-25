import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'applications', loadComponent: () => import('./components/application-list/application-list.component').then(m => m.ApplicationListComponent), canActivate: [authGuard] },
  { path: 'applications/add', loadComponent: () => import('./components/application-form/application-form.component').then(m => m.ApplicationFormComponent), canActivate: [authGuard] },
  { path: 'applications/edit/:id', loadComponent: () => import('./components/application-form/application-form.component').then(m => m.ApplicationFormComponent), canActivate: [authGuard] },
  { path: 'applications/:id', loadComponent: () => import('./components/application-detail/application-detail.component').then(m => m.ApplicationDetailComponent), canActivate: [authGuard] },
  { path: 'resume', loadComponent: () => import('./components/resume-analyzer/resume-analyzer.component').then(m => m.ResumeAnalyzerComponent), canActivate: [authGuard] },
  { path: 'email', loadComponent: () => import('./components/email-settings/email-settings.component').then(m => m.EmailSettingsComponent), canActivate: [authGuard] },
  { path: 'email-callback', loadComponent: () => import('./components/email-callback/email-callback.component').then(m => m.EmailCallbackComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
