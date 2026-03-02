import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // No mandar token en login/register
  if (
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register')
  ) {
    return next(req);
  }

  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
