import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

/**
 * - ajoute "Authorization: Bearer <jeton>" aux appels vers notre backend uniquement ;
 * - si le backend répond 401 (jeton expiré ou invalide), déconnecte l'utilisateur.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isBackendCall = req.url.startsWith(environment.apiUrl);
  const token = isBackendCall ? auth.getToken() : null;

  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const isLoginCall = req.url.endsWith('/api/auth/login');
      if (error instanceof HttpErrorResponse && error.status === 401 && isBackendCall && !isLoginCall) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
