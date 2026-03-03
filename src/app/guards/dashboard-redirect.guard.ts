import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const dashboardRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // TRANSPORTISTA -> rutas
  if (auth.hasRole('TRANSPORTISTA') && !auth.hasRole('ADMIN')) {
    return router.parseUrl('/app/rutas');
  }

  // USER -> dashboard user
  if (auth.hasRole('USER') && !auth.hasRole('ADMIN')) {
    return router.parseUrl('/app/dashboard-user');
  }

  // ADMIN -> dashboard normal
  return true;
};
