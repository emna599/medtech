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
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/admin-shell').then((m) => m.AdminShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Tableau de bord',
        loadComponent: () => import('./features/admin/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'users',
        title: 'Comptes utilisateurs',
        loadComponent: () => import('./features/admin/users/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'rooms',
        title: 'Chambres et étages',
        loadComponent: () => import('./features/admin/rooms/rooms-page').then((m) => m.RoomsPage),
      },
      {
        path: 'residents',
        title: 'Résidents',
        loadComponent: () =>
          import('./features/admin/residents/residents-page').then((m) => m.ResidentsPage),
      },
      {
        path: 'residents/:id',
        title: 'Fiche résident',
        loadComponent: () =>
          import('./features/admin/residents/resident-detail-page').then((m) => m.ResidentDetailPage),
      },
    ],
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
