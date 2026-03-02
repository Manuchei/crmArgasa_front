import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { Empresa, EmpresaService } from '../services/empresa.service';

const normalizar = (value: any): Empresa | null => {
  const e = (value ?? '').toString().trim().toUpperCase();
  if (e === 'ARGASA' || e === 'ELECTROLUGA') return e as Empresa;
  return null;
};

const checkEmpresa = (stateUrl?: string, qpEmpresa?: string | null) => {
  const empresaService = inject(EmpresaService);
  const router = inject(Router);

  // 1) Si ya está en el servicio, OK
  const actual = empresaService.getEmpresa();
  if (actual) return true;

  // 2) Rehidratar desde localStorage
  const stored = normalizar(localStorage.getItem('empresa_activa'));
  if (stored) {
    empresaService.setEmpresa(stored);
    return true;
  }

  // 3) Rehidratar desde query param (?empresa=ARGASA)
  const fromQp = normalizar(qpEmpresa);
  if (fromQp) {
    empresaService.setEmpresa(fromQp);
    return true;
  }

  // 4) Por si no llega qpEmpresa por route (casos raros), intento parsear state.url
  if (stateUrl && stateUrl.includes('?')) {
    const qs = stateUrl.split('?')[1] ?? '';
    const params = new URLSearchParams(qs);
    const empresa = normalizar(params.get('empresa'));
    if (empresa) {
      empresaService.setEmpresa(empresa);
      return true;
    }
  }

  // 5) Si no hay empresa válida, al selector
  return router.parseUrl('/');
};

// ✅ IMPORTANTE: ahora usamos los args (route, state) para leer query params
export const empresaGuard: CanActivateFn = (route, state) =>
  checkEmpresa(state?.url, route.queryParamMap.get('empresa'));

export const empresaChildGuard: CanActivateChildFn = (route, state) =>
  checkEmpresa(state?.url, route.queryParamMap.get('empresa'));
