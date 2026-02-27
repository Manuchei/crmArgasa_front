import { HttpInterceptorFn } from '@angular/common/http';

export const empresaInterceptor: HttpInterceptorFn = (req, next) => {
  const empresa =
    (localStorage.getItem('empresa_activa') || '').toUpperCase().trim();

  if (!empresa) return next(req);

  return next(
    req.clone({
      headers: req.headers.set('X-Empresa', empresa),
    }),
  );
};