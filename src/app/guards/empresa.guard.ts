import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { Empresa, EmpresaService } from '../services/empresa.service';

const checkEmpresa = () => {
  const empresaService = inject(EmpresaService);
  const router = inject(Router);

  // 1) Si ya está en el servicio, OK
  if (empresaService.getEmpresa()) return true;

  // 2) Rehidratar desde localStorage (tu key real)
  const stored = (localStorage.getItem('empresa_activa') ?? '')
    .toUpperCase()
    .trim();

  if (stored === 'ARGASA' || stored === 'ELECTROLUGA') {
    // Esto rellena el BehaviorSubject y aplica el tema
    empresaService.setEmpresa(stored as Empresa);
    return true;
  }

  // 3) Si no hay empresa válida, al selector
  return router.parseUrl('/');
};

export const empresaGuard: CanActivateFn = () => checkEmpresa();
export const empresaChildGuard: CanActivateChildFn = () => checkEmpresa();
