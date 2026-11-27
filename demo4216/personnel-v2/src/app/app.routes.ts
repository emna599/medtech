import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'personnel' },
  {
    path: 'login',
    canActivate: [() => {
      window.location.replace('/login');
      return false;
    }],
    children: [],
  },
  {
    path: 'personnel',
    title: 'Espace personnel',
    canActivate: [roleGuard(['PERSONNEL']), () => {
      const auth = inject(AuthService);
      if (!auth.isSessionValid() || auth.currentUser()?.role !== 'PERSONNEL') return true;
      const unavailable = () => {
        window.location.replace('/profil-indisponible');
        return false;
      };
      return inject(HttpClient).get<{ kitchenOnly: boolean }>('/api/personnel/access').pipe(
        map(access => access.kitchenOnly ? unavailable() : true),
        catchError(() => of(unavailable())),
      );
    }],
    loadComponent: () =>
      import('./features/personnel/personnel-dashboard').then((m) => m.PersonnelDashboard),
  },
  { path: '**', redirectTo: 'login' },
];
