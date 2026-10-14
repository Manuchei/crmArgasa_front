import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      return router.parseUrl('/login');
    }

    if (auth.hasRole(...allowedRoles)) {
      return true;
    }

    if (auth.hasRole('USER', 'ADMIN', 'DEVELOPER')) {
      return router.parseUrl('/app/dashboard');
    }

    if (auth.hasRole('TRANSPORTISTA')) {
      return router.parseUrl('/app/rutas');
    }

    return router.parseUrl('/login');
  };
};
