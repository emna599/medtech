import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { PersonnelService } from './core/services/personnel.service';
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
    canActivate: [roleGuard(['PERSONNEL']), () => {
      const auth = inject(AuthService);
      if (!auth.isSessionValid() || auth.currentUser()?.role !== 'PERSONNEL') return true;
      const navigation = inject(Router).currentNavigation();
      const identifiedResident = navigation?.extras.state?.['identifiedResidentId'];
      const router = inject(Router);
      const unavailable = router.createUrlTree(['/profil-indisponible']);
      return inject(PersonnelService).access().pipe(
        map(access => {
          if (access.kitchenOnly) return unavailable;
          if (identifiedResident) return true;
          window.location.replace(access.diningOnly ? '/v2/personnel?tables=1' : '/v2/personnel');
          return false;
        }),
        catchError(() => of(unavailable)),
      );
    }],
    loadComponent: () =>
      import('./features/personnel/personnel-dashboard').then((m) => m.PersonnelDashboard),
  },
  {
    path: 'medecin',
    pathMatch: 'full',
    redirectTo: 'medecin/residents',
  },
  {
    path: 'medecin/residents',
    title: 'Résidents',
    canActivate: [roleGuard(['MEDECIN'])],
    loadComponent: () =>
      import('./features/medecin/residents/resident-list').then((m) => m.ResidentList),
  },
  {
    path: 'medecin/residents/:id',
    title: 'Fiche du résident',
    canActivate: [roleGuard(['MEDECIN'])],
    loadComponent: () =>
      import('./features/medecin/residents/resident-detail').then((m) => m.ResidentDetailPage),
  },
  {
    path: 'b',
    title: 'Identifier un résident',
    loadComponent: () => import('./features/bracelet-entry/bracelet-entry').then(m => m.BraceletEntry),
  },
  {
    path: 'profil-indisponible',
    title: 'Profil indisponible',
    canActivate: [roleGuard(['PERSONNEL'])],
    loadComponent: () => import('./preview-profile-unavailable').then(m => m.PreviewProfileUnavailable),
  },
  { path: '**', redirectTo: 'login' },
];
