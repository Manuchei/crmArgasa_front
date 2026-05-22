import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { IVisita } from '../interfaces/ivisita';
import { IVisitaRequest } from '../interfaces/ivisita-request';

@Injectable({ providedIn: 'root' })
export class VisitasService {
  private baseUrl = `${environment.apiUrl}/visitas`;

  constructor(private http: HttpClient) {}

  private getEmpresaActual(): 'ARGASA' | 'ELECTROLUGA' {
    const emp = (
      localStorage.getItem('empresa_activa') || 'ARGASA'
    ).toUpperCase();
    return emp === 'ELECTROLUGA' ? 'ELECTROLUGA' : 'ARGASA';
  }

  getVisitasDia(fecha: string, empresa?: string): Observable<IVisita[]> {
    const emp = (empresa ?? this.getEmpresaActual()).toUpperCase();
    const params = new HttpParams().set('empresa', emp);

    return this.http.get<IVisita[]>(`${this.baseUrl}/dia/${fecha}`, { params });
  }

  getAll(empresa?: string): Observable<IVisita[]> {
    const emp = (empresa ?? this.getEmpresaActual()).toUpperCase();
    const params = new HttpParams().set('empresa', emp);

    return this.http.get<IVisita[]>(this.baseUrl, { params });
  }

  crearVisita(visita: IVisitaRequest): Observable<IVisita> {
    const empresa = this.getEmpresaActual();

    return this.http.post<IVisita>(this.baseUrl, {
      ...visita,
      empresa,
    });
  }

  actualizarVisita(id: number, visita: IVisitaRequest): Observable<IVisita> {
    const empresa = this.getEmpresaActual();

    return this.http.put<IVisita>(`${this.baseUrl}/${id}`, {
      ...visita,
      empresa,
    });
  }

  eliminarVisita(id: number): Observable<void> {
    const empresa = this.getEmpresaActual();
    const params = new HttpParams().set('empresa', empresa);

    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}
