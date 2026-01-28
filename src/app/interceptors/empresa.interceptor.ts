import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EmpresaService } from '../services/empresa.service';

export const empresaInterceptor: HttpInterceptorFn = (req, next) => {
  const empresaService = inject(EmpresaService);
  const empresa = empresaService.getEmpresa();

  if (!empresa) {
    return next(req);
  }

  const reqConEmpresa = req.clone({
    headers: req.headers.set('X-Empresa', empresa)
  });

  return next(reqConEmpresa);
};
