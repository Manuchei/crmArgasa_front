import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ITarea } from '../interfaces/itarea';
import { ITareaRequest } from '../interfaces/itarea-request';

@Injectable({ providedIn: 'root' })
export class TareasService {
  private baseUrl = `${environment.apiUrl}/tareas`;

  constructor(private http: HttpClient) {}

  private getEmpresaActual(): 'ARGASA' | 'ELECTROLUGA' {
    const emp = (
      localStorage.getItem('empresa_activa') || 'ARGASA'
    ).toUpperCase();
    return emp === 'ELECTROLUGA' ? 'ELECTROLUGA' : 'ARGASA';
  }

  getTareasDia(fecha: string, empresa?: string): Observable<ITarea[]> {
    const emp = (empresa ?? this.getEmpresaActual()).toUpperCase();
    const params = new HttpParams().set('empresa', emp);

    return this.http.get<ITarea[]>(`${this.baseUrl}/dia/${fecha}`, { params });
  }

  getAll(empresa?: string): Observable<ITarea[]> {
    const emp = (empresa ?? this.getEmpresaActual()).toUpperCase();
    const params = new HttpParams().set('empresa', emp);

    return this.http.get<ITarea[]>(this.baseUrl, { params });
  }

  crearTarea(tarea: ITareaRequest): Observable<ITarea> {
    const empresa = this.getEmpresaActual();

    return this.http.post<ITarea>(this.baseUrl, {
      ...tarea,
      empresa,
    });
  }

  actualizarTarea(id: number, tarea: ITareaRequest): Observable<ITarea> {
    const empresa = this.getEmpresaActual();

    return this.http.put<ITarea>(`${this.baseUrl}/${id}`, {
      ...tarea,
      empresa,
    });
  }

  eliminarTarea(id: number): Observable<void> {
    const empresa = this.getEmpresaActual();
    const params = new HttpParams().set('empresa', empresa);

    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}
