import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { EmpresaService } from '../services/empresa.service';

const checkEmpresa = () => {
  const empresaService = inject(EmpresaService);
  const router = inject(Router);

  if (empresaService.getEmpresa()) return true;

  return router.createUrlTree(['']); // selector
};

export const empresaGuard: CanActivateFn = () => checkEmpresa();
export const empresaChildGuard: CanActivateChildFn = () => checkEmpresa();
