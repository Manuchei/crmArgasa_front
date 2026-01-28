import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Empresa = 'ARGASA' | 'ELECTROLUGA';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private readonly empresaKey = 'empresa_activa';

  private empresaSubject = new BehaviorSubject<Empresa | null>(
    this.getEmpresaFromStorage()
  );

  readonly empresa$ = this.empresaSubject.asObservable();

  constructor() {
    const empresa = this.empresaSubject.value;
    if (empresa) {
      this.aplicarTema(empresa);
    }
  }

  private getEmpresaFromStorage(): Empresa | null {
    const e = localStorage.getItem(this.empresaKey);
    if (e === 'ARGASA' || e === 'ELECTROLUGA') return e;
    return null;
  }

  setEmpresa(empresa: Empresa): void {
    localStorage.setItem(this.empresaKey, empresa);
    this.empresaSubject.next(empresa);
    this.aplicarTema(empresa);
  }

  clearEmpresa(): void {
    localStorage.removeItem(this.empresaKey);
    this.empresaSubject.next(null);
    this.limpiarTema();
  }

  getEmpresa(): Empresa | null {
    return this.empresaSubject.value;
  }

  // 🎨 THEMING (lo dejamos, luego lo retocas)
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
