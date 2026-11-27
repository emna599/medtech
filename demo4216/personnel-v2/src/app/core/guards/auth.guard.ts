import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Role } from '../../shared/models/auth.model';

/** Page de connexion : si on est déjà connecté, on est renvoyé vers son espace. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isSessionValid() ? router.createUrlTree([auth.homeRoute()]) : true;
};

/**
 * Protège une route : il faut être connecté ET avoir l'un des rôles autorisés.
 * (Ce n'est qu'un confort d'interface : le vrai contrôle des droits est fait par le backend.)
 */
export function roleGuard(allowedRoles: readonly Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isSessionValid()) {
      return router.createUrlTree(['/login']);
    }

    const role = auth.currentUser()?.role;
    if (role && allowedRoles.includes(role)) {
      return true;
    }
    return router.createUrlTree([auth.homeRoute()]);
  };
}
