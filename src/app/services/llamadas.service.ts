import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ILlamada } from '../interfaces/illamda';
import { IEventoCalendario } from '../interfaces/ievento-calendario';
import { ILlamadaRequest } from '../interfaces/illamada-request';

@Injectable({ providedIn: 'root' })
export class LlamadasService {
  private baseUrl = 'http://localhost:9018/api/llamadas';

  constructor(private http: HttpClient) {}

  // ✅ Empresa actual (misma idea que usas en el componente)
 private getEmpresaActual(): 'ARGASA' | 'ELECTROLUGA' {
  const emp = (localStorage.getItem('empresa_activa') || 'ARGASA').toUpperCase();
  return emp === 'ELECTROLUGA' ? 'ELECTROLUGA' : 'ARGASA';
}



  // ✅ CORREGIDO: ahora manda ?empresa=...
  getEventosCalendario(empresa?: string): Observable<IEventoCalendario[]> {
    const emp = (empresa ?? this.getEmpresaActual()).toUpperCase();
    const params = new HttpParams().set('empresa', emp);
    return this.http.get<IEventoCalendario[]>(`${this.baseUrl}/eventos`, { params });
  }

  getById(id: number): Observable<ILlamada> {
    return this.http.get<ILlamada>(`${this.baseUrl}/${id}`);
  }

  crearLlamada(llamada: ILlamadaRequest): Observable<ILlamada> {
  const empresa = this.getEmpresaActual();
  return this.http.post<ILlamada>(this.baseUrl, { ...llamada, empresa });
}

actualizarLlamada(id: number, llamada: any): Observable<ILlamada> {
  const empresa = this.getEmpresaActual();
  return this.http.put<ILlamada>(`${this.baseUrl}/${id}`, { ...llamada, empresa });
}


  eliminarLlamada(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ✅ CORREGIDO: ahora manda ?empresa=...
  getLlamadasDia(fecha: string, empresa?: string): Observable<ILlamada[]> {
    const emp = (empresa ?? this.getEmpresaActual()).toUpperCase();
    const params = new HttpParams().set('empresa', emp);
    return this.http.get<ILlamada[]>(`${this.baseUrl}/dia/${fecha}`, { params });
  }

  getProximasLlamadas(limit = 10) {
    // Si tu backend también filtra por empresa aquí, dímelo y lo ajusto igual.
    return this.http.get<ILlamada[]>(`${this.baseUrl}/proximas?limit=${limit}`);
  }
}
