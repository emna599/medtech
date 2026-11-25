import { Routes } from '@angular/router';
import { guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    title: 'Connexion',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    title: 'Administration',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/admin-dashboard').then((m) => m.AdminDashboard),
  },
  {
    path: 'personnel',
    title: 'Espace personnel',
    canActivate: [roleGuard(['PERSONNEL'])],
    loadComponent: () =>
      import('./features/personnel/personnel-dashboard').then((m) => m.PersonnelDashboard),
  },
  {
    path: 'medecin',
    title: 'Espace médecin',
    canActivate: [roleGuard(['MEDECIN'])],
    loadComponent: () =>
      import('./features/medecin/medecin-dashboard').then((m) => m.MedecinDashboard),
  },
  { path: '**', redirectTo: 'login' },
];
