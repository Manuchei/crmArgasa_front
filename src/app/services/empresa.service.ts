import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Empresa = 'ARGASA' | 'ELECTROLUGA';

@Injectable({
  providedIn: 'root',
})
export class EmpresaService {
  private readonly empresaKey = 'empresa_activa';

  private empresaSubject = new BehaviorSubject<Empresa | null>(
    this.getEmpresaFromStorage(),
  );

  readonly empresa$ = this.empresaSubject.asObservable();

  constructor() {
    const empresa = this.empresaSubject.value;
    if (empresa) {
      this.aplicarTema(empresa);
    }
  }

  private normalizarEmpresa(value: any): Empresa | null {
    const e = (value ?? '').toString().trim().toUpperCase();
    if (e === 'ARGASA' || e === 'ELECTROLUGA') return e as Empresa;
    return null;
  }

  private getEmpresaFromStorage(): Empresa | null {
    return this.normalizarEmpresa(localStorage.getItem(this.empresaKey));
  }

  /**
   * ✅ Rehidrata el servicio desde localStorage sin volver a escribirlo.
   * Útil para pestañas nuevas / refresh / rutas directas.
   */
  rehidratarDesdeStorage(): Empresa | null {
    const fromLs = this.getEmpresaFromStorage();
    if (fromLs) {
      this.empresaSubject.next(fromLs);
      this.aplicarTema(fromLs);
      return fromLs;
    }
    return null;
  }

  setEmpresa(empresa: Empresa): void {
    const e = this.normalizarEmpresa(empresa);
    if (!e) return;

    localStorage.setItem(this.empresaKey, e);
    this.empresaSubject.next(e);
    this.aplicarTema(e);
  }

  clearEmpresa(): void {
    localStorage.removeItem(this.empresaKey);
    this.empresaSubject.next(null);
    this.limpiarTema();
  }

  getEmpresa(): Empresa | null {
    // ✅ Si por lo que sea está vacío en memoria, intento rehidratar
    const actual = this.empresaSubject.value;
    if (actual) return actual;
    return this.rehidratarDesdeStorage();
  }

  // 🎨 THEMING
  private aplicarTema(empresa: Empresa): void {
    const body = document.body;
    body.classList.remove('tema-argasa', 'tema-electroluga');

    if (empresa === 'ARGASA') body.classList.add('tema-argasa');
    if (empresa === 'ELECTROLUGA') body.classList.add('tema-electroluga');
  }

  private limpiarTema(): void {
    document.body.classList.remove('tema-argasa', 'tema-electroluga');
  }
}
