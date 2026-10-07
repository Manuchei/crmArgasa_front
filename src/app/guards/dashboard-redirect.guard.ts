import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const dashboardRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // ADMIN y DEVELOPER entran al dashboard normal.
  if (auth.hasRole('ADMIN')) {
    return true;
  }

  if (auth.hasRole('TRANSPORTISTA')) {
    return router.parseUrl('/app/rutas');
  }

  if (auth.hasRole('USER')) {
    return router.parseUrl('/app/dashboard-user');
  }

  return router.parseUrl('/login');
};
